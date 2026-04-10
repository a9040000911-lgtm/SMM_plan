# SMM Plan — Отчёт по аудиту логических ошибок

**Проект:** SMM Plan (SaaS-платформа управления SMM-услугами)  
**Репозиторий:** https://github.com/a9040000911-lgtm/SMM_plan  
**Дата:** 2026-04-10  
**Проанализировано:** ~100+ файлов исходного кода  
**Стек:** Next.js 16, React 19, TypeScript 5.7, Prisma 5.22, PostgreSQL, Telegraf.js

---

## Сводная статистика

| Уровень критичности | Количество находок |
|---------------------|--------------------|
| CRITICAL | 12 |
| HIGH | 18 |
| MEDIUM | 25+ |
| LOW | 15+ |
| **Итого** | **70+** |

---

## 1. CRITICAL — Немедленное исправление (12)

### 1.1 Заказы AWAITING_PAYMENT активируются без списания баланса

**Файлы:** `src/services/orders/payment-confirmation.service.ts:46-48`, `src/orchestration/handlers/payment.handler.ts:63-77`

**Описание:** При создании заказа с insufficient balance создаётся AWAITING_PAYMENT и генерируется платёжная ссылка. Когда webhook YooKassa подтверждает платёж:
1. `PaymentConfirmationService.confirmPayment()` начисляет баланс пользователя (`balance: { increment: tx.amount }`)
2. Выбрасывается событие `PAYMENT_CONFIRMED`
3. `PaymentOrchestrator.handlePaymentConfirmed()` активирует заказ (статус → PENDING)
4. **Списание баланса за заказ НЕ происходит**

**Сравнение:** Quick Order path корректно вызывает `OrderActivationService.initiateOrder()`, который списывает баланс через `OrderFinancialService.chargeOrder()`. AWAITING_PAYMENT path — не вызывает.

**Влияние:** Прямые финансовые потери. Пользователь платит 100₽ → баланс +100₽, заказ активирован, услуга предоставлена. Баланс не списан. Услуга фактически бесплатна.

**Рекомендация:** В `PaymentOrchestrator.processActivation()` для AWAITING_PAYMENT добавить вызов `OrderFinancialService.chargeOrder()`, аналогично Quick Order path.

---

### 1.2 Batch-заказы создаются без транзакции — orphan orders при падении

**Файл:** `src/app/api/client/orders/route.ts:312-346`

**Описание:** В AWAITING_PAYMENT batch flow заказы создаются в цикле вне транзакции:
```typescript
const createdOrderIds: number[] = [];
for (const p of preparedOrders) {
    const o = await prisma.order.create({ ... }); // Без транзакции!
    createdOrderIds.push(o.id);
}
const tx = await prisma.transaction.create({ ... }); // После всех заказов
```

**Влияние:** При crash/timeot/kill процесса между созданием 2-го и 5-го заказа:
- 2 заказа существуют в БД со статусом AWAITING_PAYMENT
- Transaction record не создан
- Платёжная URL не возвращена пользователю
- Orphan заказы накапливаются

**Рекомендация:** Обернуть batch-создание в `prisma.$transaction()`.

---

### 1.3 Float-прецизия ломает TransactionGuard.verify

**Файлы:** `src/orchestration/handlers/payment.handler.ts:41-51`, `src/services/security/transaction-guard.ts:32-34`

**Описание:** В `PaymentConfirmationService` payload конструируется:
```typescript
amount: tx.amount.toNumber()  // Decimal → JavaScript float
```
Затем `TransactionGuard.verify` сравнивает:
```typescript
const expectedAmt = new Decimal(expectedAmount); // float → Decimal (потеря точности!)
if (!actualAmount.equals(expectedAmt)) return { valid: false };
```

JavaScript float не может точно представить многие десятичные значения. `Decimal(33.33)` может стать `33.330000000000005421...`, что не равно исходному `Decimal(33.33)`.

**Влияние:** Верификация молча падает. Баланс начислен (committed transaction), но заказ никогда не активируется. Деньги пользователя «застревают».

**Рекомендация:** Передавать `tx.amount` как Decimal напрямую (без `.toNumber()`). Добавить tolerant comparison fallback.

---

### 1.4 Ledger-записи в batch-заказах содержат идентичный stale balanceBefore

**Файлы:** `src/services/orders/mass-order.service.ts:136-184`, `src/services/finance/ledger.service.ts:41-57`

**Описание:** В `processMassOrder` баланс декрементируется через `updateMany` на строке 178, ПОСЛЕ записи всех ledger entries (строки 151-175). `LedgerService.record` читает текущий баланс на строке 41:
```typescript
const user = await UserRepository.findById(userId, tx);
const _balanceBefore = user.balance;
```

Поскольку `updateMany` ещё не выполнен, **все ledger entries** записывают **одинаковый** `balanceBefore`.

**Влияние:** Для batch из 5 заказов на 500₽ из баланса 1000₽:
- Запись 1: balanceBefore=1000, balanceAfter=900 (верно)
- Запись 2: balanceBefore=1000, balanceAfter=900 (неверно, должно быть 900→800)
- Запись 3-5: аналогично

**Рекомендация:** Переставить операции — декрементировать баланс ДО записи ledger, или использовать running balance tracker.

---

### 1.5 Клиент видит скидочную цену, но списывается полная

**Файлы:** `src/app/api/client/services/route.ts:115`, `src/app/api/client/orders/route.ts:233,496`

**Описание:** Каталог услуг возвращает `personalizedPrice`:
```typescript
personalizedPrice: discount > 0 ? price * (1 - discount / 100) : price
```
Но при создании заказа сервер рассчитывает:
```typescript
const totalPrice = pricePer1000.mul(quantity).div(1000);
```
Используется **полный** `service.pricePer1000` без применения скидки. `PricingService.calculateOrderDetails` (с дисконтом) вызывается только в Quick Order metadata path, не в основном order creation flow.

**Влияние:** Пользователь видит скидочную цену, но списывается полная. Нарушение пользовательского опыта и потенциальные юридические риски.

**Рекомендация:** Применять скидку во всех путях создания заказа через `PricingService.calculateOrderDetails()`.

---

### 1.6 Хардкодный бэкдор `'super-secret-123'` для подтверждения платежей

**Файл:** `src/app/api/admin/force-confirm/route.ts:19`

**Описание:**
```typescript
if (!session || secret !== 'super-secret-123')
```
Админ-эндпоинт force-confirm аутентифицируется через хардкодную строку как query parameter. Секрет виден в Git истории. Session check комбинирован через OR — одного секрета достаточно, даже без админ-сессии.

**Влияние:** Любой, знающий эту строку, может подтвердить платёж без оплаты.

**Рекомендация:** Удалить хардкодный секрет. Использовать env variable + JWT-based admin session.

---

### 1.7 MASTER_KEY обходит 2FA для любого пользователя через публичный API

**Файл:** `src/app/api/auth/verify-2fa/route.ts:30-33`

**Описание:**
```typescript
const masterKey = process.env.ADMIN_MASTER_KEY;
if (user.twoFactorCode !== code && code !== masterKey) {
    return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
}
```
Публичный неавторизованный эндпоинт `/api/auth/verify-2fa` принимает ADMIN_MASTER_KEY как валидный 2FA-код для **любого пользователя**. В отличие от `/api/admin/auth/route.ts:48` (где master key ограничен `art@artmspektr.ru`), здесь нет email-ограничения.

**Влияние:** При утечке ADMIN_MASTER_KEY любой человек может обойти 2FA любого аккаунта.

**Рекомендация:** Удалить master key из публичного эндпоинта или ограничить его использование.

---

### 1.8 Fallback JWT-секрет — известная строка

**Файлы:** `src/services/core/jwt.ts:8`, `src/services/core/magic-auth.ts:8`

**Описание:**
```typescript
const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'FALLBACK_SECRET_DO_NOT_USE_IN_PROD';
```
Если `NEXTAUTH_SECRET` не задан (deployment misconfiguration), все JWT подписываются известным ключом. Затрагивает admin session JWT и magic token для клиентской аутентификации.

**Влияние:** Атакующий может подписать свои JWT, получив полный admin/user access.

**Рекомендация:** Удалить fallback. Крашить приложение при отсутствии `NEXTAUTH_SECRET`.

---

### 1.9 Bootstrap: первый посетитель становится супер-админом

**Файл:** `src/app/api/admin/auth/route.ts:96-178`

**Описание:** Когда `adminCount === 0`, первый человек, обратившийся к `/api/admin/auth` с любым email/password, автоматически получает `ADMIN` с `isGlobalAdmin: true`. Нет rate limiting, нет проверки минимальной длины пароля, нет CAPTCHA.

**Влияние:** Атакующий, обнаруживший неинициализированную систему, создаёт супер-админ с паролем "a".

**Рекомендация:** Добавить rate limiting, политику паролей, CAPTCHA при bootstrap.

---

### 1.10 Encrypted/decrypted token mismatch — дублирование ботов каждые 60 сек

**Файл:** `src/bot/index.ts:180,196,202,219-220`

**Описание:**
- `startBotInstance()` сохраняет `decryptedToken` в `launchedBotTokens` (строка 180)
- `checkNewBots()` проверяет `project.botToken` (зашифрованное значение) против `launchedBotTokens` (строка 220)
- При failure также удаляет `project.botToken` (encrypted) из множества с decrypted (строки 196, 202)

**Влияние:** Каждый активный проект-бот перезапускается каждые 60 секунд, т.к. `has()` всегда возвращает `false`. Дублирование обработки сообщений, API rate limiting, непредсказуемое поведение.

**Рекомендация:** Исправить на единый формат (всегда encrypted или всегда decrypted) при проверке/сохранении.

---

### 1.11 Seed-скрипт ссылается на несуществующий composite key

**Файл:** `scripts/seed-test-data-v7.ts:28-33`

**Описание:**
```typescript
where: {
    projectId_email: { projectId: project.id, email: email }
}
```
Prisma schema содержит `email String? @unique` (global unique), **не** `@@unique([projectId, email])`. Composite key `projectId_email` не существует.

**Влияние:** Seed скрипт крашится при деплое/восстановлении: `Invalid prisma.user.upsert() invocation`.

**Рекомендация:** Использовать `where: { email }` или добавить `@@unique([projectId, email])` в схему.

---

### 1.12 approve_refill / cancel_refill в боте без проверки прав

**Файл:** `src/bot/handlers/callback.handler.ts:183-200`

**Описание:** Callback handlers парсят `orderId` и `dropAmount` из callback data и выполняют refill **без проверки прав пользователя**:
```typescript
bot.action(/^approve_refill_(.+)_(\d+)$/, async (ctx: any) => {
    const success = await AutoRefillService.executeRefillAfterApproval(orderId, dropAmount);
});
```

**Влияние:** Любой пользователь, перехвативший callback data (скриншот, forward сообщения), может одобрить/отменить refill любого заказа. Privilege escalation.

**Рекомендация:** Добавить проверку `user.role` (ADMIN/SUPPORT) перед выполнением действия.

---

## 2. HIGH — Высокий приоритет (18)

### 2.1 TMA: error handler помечает неверную транзакцию как FAILED

**Файл:** `src/app/api/tma/payments/route.ts:102-143`

Catch block ищет последний PENDING DEPOSIT через `findFirst`, но не использует `transaction.id` из строки 40. Если у пользователя есть предыдущий pending deposit, блок помечает **его** как ERROR, блокируя webhook подтверждение.

**Рекомендация:** Использовать `transaction.id` из scope вместо поиска через `findFirst`.

---

### 2.2 Отмена заказа — provider cancel и DB update не в транзакции

**Файл:** `src/app/api/client/orders/[id]/route.ts:100-131`

```typescript
const cancelRes = await ProviderService.cancelOrder(order);  // External API
if (cancelRes.success) {
    await prisma.order.update({ ... status: 'CANCELED' ... });  // DB
}
```

Если provider отменил, но DB update упал — заказ остаётся PROCESSING, но provider уже не работает. Заказ «застревает».

**Рекомендация:** Сначала обновить БД, потом отменять у провайдера (compensating transaction на failure).

---

### 2.3 TMA: захардкоженные уровни лояльности отличаются от PricingService

**Файл:** `src/app/api/tma/orders/route.ts:58-69`

TMA имеет собственные loyalty levels (0/3/7/10%) без promo codes и Priority Pass. Web-клиент использует `PricingService.calculateOrderDetails()`.

**Рекомендация:** Заменить хардкод на вызов `PricingService` во всех каналах.

---

### 2.4 Batch активация заказов без транзакции

**Файл:** `src/orchestration/handlers/payment.handler.ts:80-83`

```typescript
for (const oid of meta.orderIds) {
    await processActivation(oid);  // Individual updates
}
```

При crash активируется только часть заказов из batch.

**Рекомендация:** Обернуть в `prisma.$transaction()`.

---

### 2.5 V2 API возвращает только первый заказ из batch

**Файл:** `src/app/api/v2/route.ts:189-201`

```typescript
const realOrder = batch.orders[0]; // Только первый
responseObj[batch.id] = {
    charge: realOrder.totalPrice.toNumber(),  // Только первого
```

B2B-клиенты получают неверные данные по batch заказам (100₽ вместо 300₽ за 3 заказа).

**Рекомендация:** Суммировать charge по всем orders в batch.

---

### 2.6 Несколько admin API routes БЕЗ аутентификации

**Файлы:**
- `src/app/api/admin/support/tickets/route.ts`
- `src/app/api/admin/support/users/route.ts`
- `src/app/api/admin/legal/route.ts`

Ноль проверок аутентификации. Любой может читать support tickets, balances, legal documents.

**Рекомендация:** Добавить admin session verification middleware.

---

### 2.7 Media proxy проверяет только НАЛИЧИЕ cookie, не JWT

**Файл:** `src/app/api/admin/media/[fileId]/route.ts:17-19`

```typescript
if (!cookieStore.has('admin_session')) { return new Response('Unauthorized', { status: 401 }); }
```

Любой cookie `admin_session=anything` проходит аутентификацию.

**Рекомендация:** Валидировать JWT внутри cookie, а не только наличие.

---

### 2.8 /api/internal/ — без аутентификации

**Файлы:** `src/app/api/internal/global-settings/route.ts`, `project-lookup/route.ts`

Экposed: все global settings (включая ключи API, секреты оплаты), project IDs, maintenance mode.

**Рекомендация:** Добавить IP-based restriction + internal API key.

---

### 2.9 Session cookie: conditional secure flag

**Файл:** `src/app/api/admin/auth/route.ts:406`

```typescript
secure: process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://')
```

При production misconfiguration с `http://` URL cookie передаётся в открытом виде.

**Рекомендация:** Всегда `secure: true` в production.

---

### 2.10 check-email — перечисление email + утечка баланса

**Файл:** `src/app/api/client/auth/check-email/route.ts:21-25`

```typescript
return NextResponse.json({
    exists: !!user,
    balance: user ? Number(user.balance) : 0,
    hasPassword: !!user?.password
});
```

Неавторизованный endpoint, без rate limiting, раскрывает баланс и наличие пароля.

**Рекомендация:** Убрать `balance` и `hasPassword`. Добавить rate limiting.

---

### 2.11 TMA user — IDOR через tgId без projectId

**Файл:** `src/app/api/tma/user/route.ts:25-32`

Запрос по `tgId` без фильтра `projectId`. Пользователь одного проекта может видеть данные другого.

**Рекомендация:** Добавить фильтр по `projectId`.

---

### 2.12 Bootstrap admin — нет rate limit и политики паролей

**Файл:** `src/app/api/admin/auth/route.ts:96-178` (дополнительно к 1.9)

**Рекомендация:** Минимум 8 символов, rate limit на endpoint, CAPTCHA.

---

### 2.13 Нет rate limiting на команды бота

**Файлы:** `src/bot/index.ts:141-149`, `src/bot/handlers/text.handler.ts`

Отсутствует rate limiting на `/start`, `/shop`, `/orders`, `/mass`, text handler (link analysis).

**Рекомендация:** Добавить per-user rate limiting на все bot commands.

---

### 2.14 admin_mute_balance — global setting для всех проектов

**Файл:** `src/bot/handlers/callback.handler.ts:56-73`

```typescript
await SettingsService.set('BALANCE_ALERT_MUTED_UNTIL', mutedUntil.toISOString(), null);
```

Админ одного проекта замещает уведомления для всех проектов.

**Рекомендация:** Использовать `projectId` в key settings.

---

### 2.15 NPS callback — нет проверки владения заказом

**Файл:** `src/bot/handlers/callback.handler.ts:155-180`

Любой пользователь может отправить NPS score для любого заказа.

**Рекомендация:** Верифицировать `order.userId === user.id`.

---

### 2.16 TMA support — пропущен projectId

**Файл:** `src/app/api/tma/support/route.ts:48-59`

Тикеты через TMA создаются без `projectId`, невидимы в project-scoped admin views.

**Рекомендация:** Добавить `projectId: project.id` в create data.

---

### 2.17 Soft-delete vs cascade delete inconsistency на User

**Файл:** `prisma/schema.prisma` (User model, line 151 vs. lines 87, 338, 787, 805, 851, 872, 1258)

User имеет `deletedAt` (soft-delete), но Achievement, Challenge, NPSSurvey, ReferralLeaderboard, Subscription используют `onDelete: Cascade`. Order и LedgerEntry — `Restrict` (default).

**Рекомендация:** Стандартизировать стратегию удаления.

---

### 2.18 TransactionStatus и TransactionType — дублирующиеся значения

**Файл:** `prisma/schema.prisma` (lines 971-987)

`TransactionStatus`: оба `SUCCESS` и `COMPLETED` (используется `COMPLETED`).  
`TransactionType`: оба `WITHDRAW` и `WITHDRAWAL`.

**Рекомендация:** Удалить `SUCCESS` и `WITHDRAW`, стандартизировать.

---

## 3. MEDIUM — Средний приоритет (25+)

### 3.1 Stale balanceBefore в ledger для single order payment

**Файл:** `src/app/api/client/orders/route.ts:246-273`

`user.balance` читается вне `$transaction`. Конкурентный deposit/order может изменить баланс между чтением и записью.

---

### 3.2 Scheduled recurring orders reuse stale totalPrice

**Файл:** `src/services/orders/scheduled-order.service.ts:118-131`

Оригинальный `totalPrice` копируется без пересчёта. При изменении цен пользователь платит старую цену.

---

### 3.3 No upper-bound validation on deposit amount

**Файл:** `src/app/api/client/payments/route.ts:22-25`

Только минимум (10₽), без максимума. Возможен deposit на 99,999,999₽.

---

### 3.4 UnifiedPaymentService — нет idempotency protection

**Файл:** `src/services/payments/unified-payment.service.ts:49-64`

Double-click «Deposit» создаёт две транзакции и два списания.

---

### 3.5 Event bus — failed handlers never retried

**Файл:** `src/services/core/event-bus.ts:38-57`

Try/catch логирует ошибку, но не retry. Заказы могут «застрять» при временных проблемах с БД.

---

### 3.6 Duplicate warrantyDays check

**Файл:** `src/app/_actions/orders/refill.ts:34-40`

Одинаковая проверка дважды подряд — copy-paste error.

---

### 3.7 Robokassa webhook — InvId/UUID type mismatch

**Файл:** `src/app/api/webhooks/robokassa/route.ts:32-33`

`InvId` (numeric) используется как fallback для поиска по UUID. Никогда не совпадёт.

---

### 3.8 TypeScript Category enum: SHARE не в Prisma

**Файл:** `src/types/enums.ts:30` vs `prisma/schema.prisma:1066-1091`

TypeScript содержит `SHARES`, Prisma содержит `REPOSTS`. Frontend и backend расходятся.

---

### 3.9 TypeScript Category enum missing 5 Prisma values

Отсутствуют: `RECOVER`, `PREMIUM`, `TRAFFIC`, `STREAMS`.

---

### 3.10 Nullable slug в unique constraint (ServiceCategory)

**Файл:** `prisma/schema.prisma:302`

`slug String?` — PostgreSQL treats NULL как уникальные, позволяя дубликаты.

---

### 3.11 Nullable pageId в unique constraint (CmsString)

**Файл:** `prisma/schema.prisma:1188`

Аналогично 3.10 — дубликаты CMS strings при `pageId = null`.

---

### 3.12 Session.userId — BigInt без FK к User

**Файл:** `prisma/schema.prisma:665`

Орфанные сессии, нет referential integrity.

---

### 3.13 ProviderLog — orphaned model

**Файл:** `prisma/schema.prisma:617-626`

`serviceId Int` без FK relation. Вероятно мёртвый код.

---

### 3.14 Provider apiKey хранится в plaintext

**Файл:** `prisma/schema.prisma:571`

Нет шифрования at rest. Compromise БД = утечка всех provider API keys.

---

### 3.15 Settings.projectId без FK

**Файл:** `prisma/schema.prisma:639-647`

Нет relation к Project, невозможны include/join.

---

### 3.16 BatchOrder, ScheduledOrder, Subscription status — plain String

**Файл:** `prisma/schema.prisma:411,891,1255`

Нет Prisma enum. Опечатки в статусе проходят валидацию.

---

### 3.17 Hardcoded admin password в seed script

**Файл:** `scripts/seed-real-data.ts:29`

```typescript
await bcrypt.hash('admin12345678', 10)
```

---

### 3.18 Subscription.userId @unique — prevents history

**Файл:** `prisma/schema.prisma:1248`

Один пользователь = одна запись подписки. Нет истории.

---

### 3.19 LoyaltyLog unique constraint + broken systemLog reference

**Файл:** `prisma/schema.prisma:699`, `src/services/users/promo.service.ts:180`

`@@unique([userId, trigger])` блокирует повторные триггеры. Code пишет в `db.systemLog.create` — модель не существует в схеме.

---

### 3.20 ReferralLeaderboard.month — DateTime как month key

**Файл:** `prisma/schema.prisma:865`

Разные timestamps одного месяца считаются разными. Phantom duplicates.

---

### 3.21 Нет Next.js middleware — нет централизованной защиты

Отсутствует `middleware.ts`. Каждая admin route должна independently проверять auth.

---

### 3.22 2FA codes stored в plaintext

**Файл:** `src/app/api/admin/auth/route.ts:255-261`

---

### 3.23 Timing-vulnerable 2FA comparison

**Файл:** `src/app/api/admin/auth/route.ts:52`

Используется `!==` вместо `crypto.timingSafeEqual`.

---

### 3.24 Client registration — no rate limit, no CAPTCHA, no password policy

**Файл:** `src/app/api/auth/register/route.ts`

---

### 3.25 Admin password reset — no role re-verification

**Файл:** `src/app/api/admin/auth/reset-password/route.ts:74-75`

Reset action не фильтрует по role (ADMIN/SUPPORT/SEO).

---

### 3.26 User password change — no minimum length

**Файл:** `src/app/api/client/user/route.ts` (PATCH)

---

### 3.27 Admin logout не инвалидирует JWT server-side

**Файл:** `src/app/admin/login/auth-actions.ts:11-15`

JWT остаётся валидным 24 часа после logout.

---

### 3.28 Бот: orders не фильтруются по projectId

**Файлы:** `src/bot/handlers/menu.handler.ts:126`, `src/app/api/tma/orders/list/route.ts:29`

---

### 3.29 Бот: no file size validation на mass order upload

**Файл:** `src/bot/commands/mass.command.ts:43-63`

Много-ГБ файл может вызвать OOM.

---

### 3.30 TMA Services API — auth validation result discarded

**Файл:** `src/app/api/tma/services/route.ts:16-19`

`validateProjectTMAData()` вызывается, но результат не проверяется. При отсутствии header — запрос проходит без аутентификации.

---

### 3.31 SessionService — unbounded in-memory cache

**Файл:** `src/services/core/session.service.ts:53`

`Map` без TTL и max size. Memory leak при долгом uptime.

---

### 3.32 Бот: showOrders — нет пагинации

**Файл:** `src/bot/handlers/menu.handler.ts:128-131`

---

### 3.33 Admin double-click confirm_order — ghost orders

**Файл:** `src/bot/handlers/order.handler.ts:28-43`

Нет idempotency. Double-tap может создать два заказа.

---

## 4. LOW — Низкий приоритет (15+)

| # | Файл | Описание |
|---|------|----------|
| 4.1 | `api/webhooks/yookassa/route.ts:54` | Дублированное объявление `isSimulation` |
| 4.2 | `api/v1/orders/route.ts:78` | `projectId = null` для всех V1 заказов |
| 4.3 | `api/admin/force-confirm/route.ts:19` | Хардкодный секрет (также в CRITICAL) |
| 4.4 | `services/core/rate-limiter.ts:103-128` | In-memory rate limit — per-process only |
| 4.5 | `utils/rate-limit.ts:23-26` | Edge runtime всегда возвращает `allowed: true` |
| 4.6 | `(client)/dashboard/layout.tsx` | Client-side only auth check |
| 4.7 | `prisma/schema.prisma` | Redundant global `@unique` на Provider.name |
| 4.8 | `prisma/schema.prisma:634` | ProviderBalanceLog блокирует удаление провайдера |
| 4.9 | `prisma/schema.prisma.bak` | Устаревший backup схемы |
| 4.10 | `bot/middleware/moderation.middleware.ts:14` | `console.error` вместо logger |
| 4.11 | `bot/handlers/order.handler.ts:46-83` | Promo code теряется при создании payment link |
| 4.12 | `bot/scenes/referral.wizard.ts:32` | `botInfo.username` может быть undefined |
| 4.13 | `bot/middleware/project.middleware.ts:11` | Base64 called «hash» |
| 4.14 | `bot/scenes/catalog.wizard.ts:138-143` | Dead code после return |
| 4.15 | `bot/scenes/order.wizard.ts:279` | Confirmation step — no-op handler |

---

## 5. Рекомендуемый план исправлений

### P0 — Немедленно (финансовые потери и безопасность)

| Приоритет | ID | Действие |
|-----------|-----|----------|
| 1 | 1.1 | Добавить списание баланса в AWAITING_PAYMENT path |
| 2 | 1.2 | Обернуть batch order creation в `prisma.$transaction()` |
| 3 | 1.3 | Использовать Decimal напрямую без `.toNumber()` в TransactionGuard |
| 4 | 1.4 | Переставить порядок: balance decrement → ledger entries |
| 5 | 1.5 | Применять скидку через PricingService во всех order paths |
| 6 | 1.6 | Удалить `'super-secret-123'`, использовать JWT + env |
| 7 | 1.7 | Ограничить master key admin-only endpoint с email check |
| 8 | 1.8 | Удалить fallback secret, крашить при отсутствии NEXTAUTH_SECRET |
| 9 | 1.9 | Добавить rate limit + password policy при bootstrap |
| 10 | 1.10 | Исправить encrypted/decrypted token mismatch |
| 11 | 1.12 | Добавить role check на approve/cancel_refill callbacks |

### P1 — Высокий приоритет (надёжность)

| Приоритет | ID | Действие |
|-----------|-----|----------|
| 12 | 2.1 | Использовать transaction.id вместо findFirst |
| 13 | 2.2 | Компенсирующая транзакция при отмене заказа |
| 14 | 2.3-2.4 | Унифицировать pricing через PricingService + транзакции |
| 15 | 2.6-2.8 | Аудит auth на всех admin/internal API routes |
| 16 | 2.13 | Rate limiting на bot commands |
| 17 | 2.14-2.16 | Исправить cross-tenant issues |
| 18 | 2.17-2.18 | Стандартизировать delete strategy и enums |

### P2 — Средний приоритет (качество)

- Унифицировать TypeScript enums с Prisma schema
- Заменить String statuses на Prisma enums
- Добавить idempotency на payment creation
- Исправить nullable unique constraints
- Добавить FK relations для orphan models
- Зашифровать provider API keys at rest
- Исправить NPS ownership verification

### P3 — Низкий приоритет (технический долг)

- Удалить stale `.bak` schema
- Заменить `console.error` на structured logger
- Добавить пагинацию в bot orders
- Исправить dead code и duplicate declarations
