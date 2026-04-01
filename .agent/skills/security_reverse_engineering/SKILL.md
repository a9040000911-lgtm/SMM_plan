---
name: Security Reverse Engineering Audit
description: Глубокий аудит безопасности с позиции атакующего. Реверс-инжиниринг кодовой базы для поиска нестандартных уязвимостей — Account Takeover, IDOR, DoS, Fail-Open, Information Disclosure и обхода изоляции. Используй этот навык ВСЕГДА, когда нужно провести проверку безопасности, security review, пентест, аудит уязвимостей или когда пользователь упоминает 'безопасность', 'уязвимости', 'security audit', 'пентест', 'reverse engineering'.
---

# Security Reverse Engineering Audit v3

## Философия
Этот навык реализует подход **"Attacker-First Thinking"** — каждый endpoint, каждый flow анализируется с позиции злоумышленника. Стандартные чеклисты (OWASP Top 10) ловят только ~60% реальных уязвимостей. Остальные 40% — это логические ошибки, Fail-Open паттерны, цепочки атак и framework-specific CVE, которые находит только глубокий реверс-инжиниринг.

**Уникальность скилла:** Объединяет 7 международных стандартов безопасности в единую методологию из **20 доменов аудита** (15 универсальных + 5 SMM-специфичных) с готовыми grep-командами, паттернами атак и правильными исправлениями.

## Когда использовать
- Перед деплоем в production
- После добавления новых API endpoints / Server Actions
- При изменении аутентификации/авторизации
- При добавлении платёжных/финансовых flows
- После обновления Next.js / React / Node.js
- По запросу "проверь безопасность" / "security audit"
- Периодически (раз в месяц) как профилактика

## Опорные стандарты

| Стандарт | Версия | Фокус |
|----------|--------|-------|
| OWASP ASVS | v5.0 (май 2025) | 350 требований, 17 глав, 3 уровня |
| OWASP API Security | Top 10 (2023) | API-специфичные уязвимости |
| OWASP LLM | Top 10 (2025) | AI/LLM-специфичные атаки |
| CWE Top 25 | 2025 | Самые опасные слабости ПО |
| NIST SP 800-53 | Rev.5 | Контроли безопасности (Fail-Closed) |
| Next.js CVE | 2025-2026 | CVE-2025-29927, CVE-2025-55182 |
| Node.js Security | 2025-2026 | SSRF, Prototype Pollution, Deserialization |

---

## Методология: 20 Доменов Глубокого Аудита

> Домены 1-15: Универсальные (любой Next.js/Node.js проект)
> Домены 16-20: SMM-Panel Specific (Smmplan архитектура)

---

### 🔴 ДОМЕН 1: Аутентификация и захват аккаунтов (Account Takeover)
**OWASP:** ASVS V2, API2:2023 | **CWE:** CWE-287, CWE-306

**Что искать:**
- Flows где пользователь идентифицируется только по email/username без пароля
- "Zero-friction" / "guest checkout" логика, пропускающая аутентификацию при условиях
- Выдача токенов (`loginToken`, `magicToken`, JWT) без подтверждения личности
- Ветки `else` в аутентификации, которые молча присваивают `userId`
- Слабые пароли: отсутствие минимальной длины, проверки на утечки (haveibeenpwned)
- Отсутствие brute-force защиты на login/OTP endpoints

**Паттерн атаки (из реального аудита Smmplan):**
```
POST /api/client/orders
{ "email": "victim@mail.ru", "serviceId": "...", "link": "...", "quantity": 100 }

→ Если у victim баланс = 0 → userId = victim.id без проверки
→ Response содержит loginToken → полный захват аккаунта
```

**Как проверять:**
```bash
# Найти все guest/email-based auth пути
grep -rn "body\.email\|userEmail\|body\.magicCode" src/app/api/ --include="*.ts"

# Найти прямое присвоение userId без проверки
grep -rn "userId = existing\.id\|userId = user\.id" src/app/api/ --include="*.ts"

# Найти выдачу токенов
grep -rn "signMagicToken\|loginToken\|signJwt\|sign(" src/ --include="*.ts"

# Найти отсутствие rate-limit на auth
grep -rn "checkRateLimit.*auth" src/app/api/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// Всегда требовать аутентификацию для существующих пользователей
if (existing) {
    if (password) {
        const isValid = await bcrypt.compare(password, existing.password || '');
        if (!isValid) return { error: 'Неверный пароль', status: 401 };
        userId = existing.id;
    } else if (magicCode) {
        const verify = await CheckoutAuthService.verifyCode(email, magicCode, projectId);
        if (!verify.success) return { error: 'Неверный код', status: 401 };
        userId = existing.id;
    } else {
        // НИКОГДА не присваивать userId без верификации
        return { error: 'USER_EXISTS', status: 409 };
    }
}
```

---

### 🔴 ДОМЕН 2: Information Disclosure (утечка данных)
**OWASP:** ASVS V8, API8:2023 | **CWE:** CWE-200, CWE-209

**Что искать:**
- Debug/diagnostic endpoints без аутентификации
- Утечка `process.env` в response (NODE_ENV, HOSTNAME, DATABASE_URL)
- Возвращение `Object.fromEntries(req.headers.entries())` — утечка заголовков
- `error.message` / `error.stack` в production response'ах
- Verbose error messages от ORM (Prisma/Sequelize SQL details)
- API responses, возвращающие лишние поля (Over-fetching / OWASP API3)
- Source maps доступные в production

**Как проверять:**
```bash
# Endpoint'ы без auth
for f in $(find src/app/api -name "route.ts"); do
  grep -qE "auth\(\)|getAdminSession|verifyAdminSession|validateProjectTMAData" "$f" || echo "NO AUTH: $f"
done

# Утечки env
grep -rn "process\.env\." src/app/api/ --include="*.ts" | grep -v "===\|!=="

# Утечки headers
grep -rn "req\.headers\.entries\|headers.*fromEntries" src/app/api/ --include="*.ts"

# Error message в response
grep -rn "error\.message\|error\.stack\|err\.message" src/app/api/ --include="*.ts"

# Проверить source maps в next.config
grep -rn "productionBrowserSourceMaps\|devtool" next.config.* --include="*.ts" --include="*.js" --include="*.mjs"
```

**✅ Правильный паттерн:**
```typescript
// Debug endpoint: только dev + global admin
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    const session = await verifyAdminSession(cookie);
    if (!session?.isGlobalAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ status: 'ok', db: 'connected' }); // Минимум данных
}

// Ошибки: никогда не возвращать error.message напрямую
catch (error) {
    console.error('[API Error]', error); // Логируем для себя
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }); // Общее сообщение
}
```

---

### 🔴 ДОМЕН 3: IDOR (Insecure Direct Object Reference)
**OWASP:** API1:2023 (BOLA) | **CWE:** CWE-639, CWE-862

**Что искать:**
- Endpoint'ы с `[id]` без проверки `resource.userId === session.userId`
- Вложенные ресурсы (`/orders/[id]/churn`, `/users/[id]/settings`) — проверка владельца часто пропускается
- Endpoint'ы принимающие `orderId`/`userId` в body без проверки принадлежности
- Sequential/numeric IDs вместо UUID (перебор проще)
- Отсутствие `projectId` scoping в multi-tenant системах

**Как проверять:**
```bash
# Найти все [id] routes
find src/app/api/client -name "route.ts" -path "*\[*\]*"

# Проверить ownership check
grep -rn "userId.*!==\|\.userId\s*!==" src/app/api/client/ --include="*.ts"

# Найти findUnique без проверки userId в where clause
grep -rn "findUnique.*where.*id:" src/app/api/client/ --include="*.ts" | grep -v "userId"

# Проверить projectId scoping
grep -rn "findMany\|findFirst" src/app/api/client/ --include="*.ts" | grep -v "projectId"
```

**✅ Правильный паттерн:**
```typescript
// Всегда проверять владельца ресурса
const order = await prisma.order.findUnique({ where: { id: orderIdNum }, select: { userId: true } });
if (!order || order.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 }); // 404, не 403!
}
```

---

### 🟠 ДОМЕН 4: Denial of Service (DoS / Resource Exhaustion)
**OWASP:** API4:2023 | **CWE:** CWE-400, CWE-770

**Что искать:**
- Pagination без верхнего лимита (`parseInt(limit)` без `Math.min`)
- Endpoint'ы принимающие массивы без ограничения длины
- Тяжёлые DB-запросы без `take` ограничения
- ReDoS (Regular Expression Denial of Service) — сложные regex на user input
- File upload без лимита размера
- Nested GraphQL / deep JSON parsing без depth limit

**Как проверять:**
```bash
# Pagination без лимита
grep -rn "parseInt.*limit\|parseInt.*searchParams.*limit" src/app/api/ --include="*.ts" | grep -v "Math.min"

# findMany без take
grep -rn "findMany" src/app/api/ --include="*.ts" | grep -v "take:"

# Массивы без лимита
grep -rn "Array\.isArray.*body\|body\.items\|body\.entries" src/app/api/ --include="*.ts"

# Сложные regex
grep -rn "new RegExp\|\.match\(.*\+" src/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// Всегда ограничивать pagination
const limit = Math.min(Math.max(parseInt(params.get('limit') || '10'), 1), 100);
const page = Math.max(parseInt(params.get('page') || '1'), 1);

// Ограничивать массивы
if (items.length > 100) return { error: 'Too many items (max 100)', status: 400 };
```

---

### 🟠 ДОМЕН 5: Fail-Open паттерны
**NIST:** SP 800-53 AC-3, SI-11 | **CWE:** CWE-636

**Что искать:**
- Rate limiter возвращает `success: true` при отсутствии Redis
- Middleware пропускает запрос при ошибке валидации
- Security checks в `catch` блоках которые `continue` вместо `throw`
- Условная аутентификация только в production
- `try/catch` вокруг auth проверки с fallback на "allow"

**Как проверять:**
```bash
# Fallback'и в security-коде
grep -rn "success: true.*fallback\|success: true.*mock\|success: true.*dev" src/services/ --include="*.ts"

# Catch блоки в middleware
grep -rn "catch.*{" src/middleware.ts src/utils/proxy-logic.ts --include="*.ts" -A3

# Условная auth
grep -rn "NODE_ENV.*development.*skip\|NODE_ENV.*!==.*production" src/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// Rate limiter: Fail-Closed в production
if (!redis) {
    if (process.env.NODE_ENV === 'production') {
        console.error('[SECURITY] No Redis! Blocking as Fail-Closed.');
        return { success: false };
    }
    return { success: true }; // Только dev
}
```

---

### 🟠 ДОМЕН 6: Security Headers
**OWASP:** ASVS V14 | **RFC:** 6797 (HSTS), 7762 (CSP)

**Что искать:**
- `Strict-Transport-Security` отключён/закомментирован
- Отсутствие `Content-Security-Policy`
- `X-Frame-Options` не установлен (Clickjacking)
- Cookie без `Secure`, `HttpOnly`, `SameSite`
- CORS с `Access-Control-Allow-Origin: *`

**Как проверять:**
```bash
# Security headers
grep -rn "Strict-Transport\|Content-Security-Policy\|X-Frame-Options" src/ --include="*.ts"

# Закомментированные headers
grep -rn "// .*Security\|// .*HSTS\|// .*CSP" src/ --include="*.ts"

# Cookie flags
grep -rn "secure:\|httpOnly:\|sameSite:" src/ --include="*.ts"

# Dangerous CORS
grep -rn "Access-Control-Allow-Origin.*\*" src/ --include="*.ts"
```

**✅ Минимальный набор:**
```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
response.headers.set('Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'none';");
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

---

### 🟠 ДОМЕН 7: Tenant Isolation / Multi-tenancy Bypass
**OWASP:** API5:2023 | **CWE:** CWE-284

**Что искать:**
- `mock_tenant` или debug params, переключающие tenant context
- Доверие к `x-tenant-id` / `x-forwarded-for` без reverse proxy гарантии
- Endpoint'ы `internal/*` без аутентификации (SSRF target)
- Cross-tenant data leaks в shared DB queries

**Как проверять:**
```bash
# Tenant-switching
grep -rn "mock_tenant\|x-tenant" src/ --include="*.ts"

# Internal API без защиты
find src/app/api/internal -name "route.ts" -exec grep -L "auth\|verify\|session" {} \;

# Queries без projectId scoping
grep -rn "findMany\|findFirst\|findUnique" src/services/ --include="*.ts" | grep -v "projectId"
```

---

### 🟠 ДОМЕН 8: Webhook и Payment Security
**OWASP:** API10:2023 | **CWE:** CWE-345, CWE-352

**Что искать:**
- IP whitelist на `x-forwarded-for` (spoofable без reverse proxy)
- Отсутствие API re-verification (доверие к webhook payload)
- Duplicate payment processing (отсутствие idempotency)
- Simulation/debug bypass в webhook handlers
- Отсутствие HMAC signature verification для webhooks
- Double-spend через race condition в финансовых endpoints

**Как проверять:**
```bash
# Webhook handlers
find src/app/api/webhooks -name "route.ts"

# IP validation
grep -rn "x-forwarded-for\|x-real-ip" src/app/api/webhooks/ --include="*.ts"

# Duplicate prevention
grep -rn "findFirst.*referenceId\|findFirst.*externalId" src/app/api/webhooks/ --include="*.ts"

# Debug bypasses
grep -rn "x-debug-simulator\|isSimulation\|bypass" src/app/api/webhooks/ --include="*.ts"

# Race conditions в финансах
grep -rn "updateMany.*balance\|increment.*balance\|decrement.*balance" src/ --include="*.ts"
```

---

### 🟡 ДОМЕН 9: Next.js Specific Vulnerabilities (CVE-2025/2026)
**Ref:** CVE-2025-29927, CVE-2025-55182, CVE-2025-55183

**Что искать:**

#### 9a. Middleware Bypass (CVE-2025-29927, CVSS 9.1)
```bash
# Проверить, что middleware не доверяет x-middleware-subrequest
grep -rn "x-middleware-subrequest\|x-middleware" src/middleware.ts --include="*.ts"

# Проверить версию Next.js — должна быть >= 15.2.3
grep "\"next\":" package.json
```

#### 9b. Server Actions как публичные endpoints
```bash
# Найти все Server Actions
grep -rn "\"use server\"" src/ --include="*.ts" --include="*.tsx" -l

# Проверить, что каждая Server Action имеет auth-check внутри
for f in $(grep -rn "\"use server\"" src/ --include="*.ts" --include="*.tsx" -l); do
  grep -qE "auth\(\)|getAdminSession|session" "$f" || echo "NO AUTH IN ACTION: $f"
done
```

#### 9c. RSC Deserialization (CVE-2025-55182, CVSS 10.0)
Убедиться что Next.js версия >= 15.3 для защиты от unsafe deserialization в RSC protocol.

**✅ Правила для Next.js:**
```
1. НИКОГДА не полагаться только на middleware для авторизации
2. Каждая Server Action = публичный HTTP POST endpoint → нужна auth внутри
3. TypeScript типы стираются в runtime → нужна Zod/runtime валидация
4. Обновлять Next.js минимум раз в месяц для security patches
```

---

### 🟡 ДОМЕН 10: Prototype Pollution
**CWE:** CWE-1321 | **Node.js Specific**

**Что искать:**
- Рекурсивный merge объектов с user input (`Object.assign`, `lodash.merge`)
- `body.__proto__`, `body.constructor.prototype` не фильтруются
- JSON.parse на user input без schema validation

**Как проверять:**
```bash
# Deep merge / Object.assign с user input
grep -rn "Object\.assign\|\.merge\|deepMerge\|_.merge" src/ --include="*.ts"

# Отсутствие Zod/schema validation на body
grep -rn "req\.json()\|await request\.json()" src/app/api/ --include="*.ts" -A5 | grep -v "schema\|parse\|validate\|Zod"

# __proto__ access
grep -rn "__proto__\|constructor\[" src/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// Всегда валидировать input через Zod schema
const schema = z.object({
    serviceId: z.string(),
    link: z.string().url(),
    quantity: z.number().int().positive().max(1000000)
});
const body = schema.parse(await req.json()); // Выбросит ошибку на __proto__
```

---

### 🟡 ДОМЕН 11: SSRF (Server-Side Request Forgery)
**OWASP:** API7:2023 | **CWE:** CWE-918

**Что искать:**
- `fetch()` / `axios.get()` с URL из user input
- Внутренние API вызовы с динамическим hostname
- Provider API URLs, хранимые в DB без валидации
- Redirect-based SSRF (fetch follows redirects to internal IPs)

**Как проверять:**
```bash
# fetch с динамическим URL
grep -rn "fetch\(.*\$\|fetch\(.*body\|fetch\(.*url\|fetch\(.*request" src/ --include="*.ts"

# Динамические URL из DB
grep -rn "apiUrl\|provider\.url\|provider\.apiUrl" src/services/ --include="*.ts"

# Проверить валидацию URL
grep -rn "new URL\|url\.protocol\|allowlist\|whitelist" src/services/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// Валидация URL перед fetch
const parsedUrl = new URL(providerApiUrl);
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) throw new Error('Invalid protocol');

// Блокировать internal IPs
const BLOCKED_HOSTS = ['127.0.0.1', 'localhost', '169.254.169.254', '0.0.0.0'];
if (BLOCKED_HOSTS.some(h => parsedUrl.hostname.includes(h))) throw new Error('Blocked host');
```

---

### 🟡 ДОМЕН 12: Race Conditions и TOCTOU
**CWE:** CWE-362, CWE-367

**Что искать:**
- Check-then-act без DB transaction (проверка баланса → списание отдельным запросом)
- Parallel webhooks для одного платежа (double-spend)
- Coupon/promo code usage без atomic check
- Sequential `findUnique` → `update` вместо atomic `updateMany` с WHERE condition

**Как проверять:**
```bash
# Check-then-act паттерн (separate check and update)
grep -rn "balance.*gte\|balance.*>=\|balance.*>" src/ --include="*.ts" -A10 | grep -B5 "decrement\|update"

# Atomic updateMany с WHERE balance check
grep -rn "updateMany.*balance.*gte\|updateMany.*where.*balance" src/ --include="*.ts"

# Promo/coupon без atomic check
grep -rn "promoCode\|coupon\|discount" src/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// Atomic check-and-update в одном запросе
const result = await tx.user.updateMany({
    where: { id: userId, balance: { gte: totalPrice } }, // Check
    data: { balance: { decrement: totalPrice } }          // Act
});
if (result.count === 0) throw new Error('Insufficient balance');
```

---

### 🟡 ДОМЕН 13: Supply Chain Security
**CWE:** CWE-1395 | **NIST:** SSDF

**Что искать:**
- `npm install` вместо `npm ci` в CI/CD
- Floating versions (`^`, `~`, `latest`) в package.json
- Package-lock.json не в git
- Postinstall scripts в зависимостях
- Dependency confusion (private packages без scope)

**Как проверять:**
```bash
# Audit dependencies
npm audit --production

# Check lock file
git ls-files package-lock.json

# Check for lifecycle scripts in deps
npm ls --json | grep -i "postinstall\|preinstall"

# Check floating versions
grep -E "\"\\^|\"\\~|\"latest" package.json
```

---

### 🟡 ДОМЕН 14: AI/LLM Security (если применимо)
**OWASP:** LLM Top 10 (2025) — LLM01: Prompt Injection

**Что искать:**
- User input, передаваемый напрямую в LLM prompt без sanitization
- RAG/knowledge base содержит user-generated content (indirect injection)
- LLM output используется для DB queries / system commands без валидации
- API keys к LLM providers hardcoded в коде
- Отсутствие output filtering (LLM может вернуть вредоносный HTML/JS)

**Как проверять:**
```bash
# LLM API calls
grep -rn "generateContent\|openai\|anthropic\|gemini" src/ --include="*.ts"

# User input в prompt
grep -rn "prompt.*body\|prompt.*user\|message.*body\|content.*body" src/ --include="*.ts"

# LLM output без sanitization
grep -rn "response\.text\|result\.text\|completion" src/ --include="*.ts" | grep -v "sanitize\|escape\|strip"
```

---

### 🟡 ДОМЕН 15: Cryptography и Secrets Management
**OWASP:** ASVS V6 | **CWE:** CWE-327, CWE-798

**Что искать:**
- Hardcoded secrets/API keys в исходном коде
- Слабые алгоритмы (MD5, SHA1 для паролей, DES)
- JWT без expiration (`exp` claim)
- Symmetric encryption с ключом из ENV без rotation
- Math.random() для security-critical values (OTP, tokens)

**Как проверять:**
```bash
# Hardcoded secrets
grep -rn "password.*=.*['\"].*['\"]$\|secret.*=.*['\"].*['\"]$\|apiKey.*=.*['\"]" src/ --include="*.ts" | grep -v "process\.env\|schema\|type\|interface"

# Слабые алгоритмы
grep -rn "createHash.*md5\|createHash.*sha1\|DES\|RC4" src/ --include="*.ts"

# JWT без expiration
grep -rn "sign(\|jwt\.sign" src/ --include="*.ts" -A5 | grep -v "expiresIn\|exp:"

# Math.random для security
grep -rn "Math\.random" src/ --include="*.ts" | grep -i "code\|token\|otp\|secret\|key\|password"
```

**✅ Правильный паттерн:**
```typescript
// Для OTP/security codes: использовать crypto
import { randomInt } from 'crypto';
const code = randomInt(100000, 999999).toString(); // Криптографически безопасно

// НЕ: Math.floor(100000 + Math.random() * 900000) — предсказуемо!
```

---

## Порядок выполнения аудита

### Фаза 1: Разведка (10 мин)
```bash
# Полная карта API surface
find src/app/api -name "route.ts" | sort

# Подсчёт endpoints
grep -rn "export async function" src/app/api/ --include="*.ts" | wc -l

# Server Actions
grep -rn "\"use server\"" src/ --include="*.ts" --include="*.tsx" -l | wc -l

# Версии (Next.js, React, Node)
grep "\"next\":\|\"react\":" package.json
node --version
```

### Фаза 2: Автоматическое сканирование (15 мин)
Выполнить grep-команды из **всех 15 доменов** выше. Записать каждый finding.

### Фаза 3: Глубокий анализ (30 мин)
Для каждого finding:
1. Прочитать полный контекст файла (`view_file`)
2. Построить цепочку атаки: вход → обработка → ущерб
3. Оценить severity: CRITICAL / HIGH / MEDIUM / LOW
4. Определить CWE ID

### Фаза 4: Исправление (по времени)
1. Начинать с CRITICAL, затем HIGH
2. Каждый fix минимально инвазивный
3. Группировать фиксы по файлам для минимизации конфликтов
4. TypeScript проверка после каждого блока: `npx tsc --noEmit`

### Фаза 5: Верификация (10 мин)
```bash
# Компиляция
npx tsc --noEmit

# Повторить grep — убедиться что паттерны исчезли
# npm audit — проверить зависимости
npm audit --production

# Smoke test — убедиться что приложение запускается
npm run dev
```

---

## Severity Classification

| Severity | Описание | SLA |
|----------|----------|-----|
| 🔴 CRITICAL | RCE, Account Takeover, Auth Bypass, Data Breach | Немедленно |
| 🟠 HIGH | IDOR, DoS, Fail-Open, Missing Headers | 24 часа |
| 🟡 MEDIUM | Info Disclosure (limited), IP Spoofing, Weak Crypto | 1 неделя |
| 🟢 LOW | Best practice violation, Minor info leak | Следующий спринт |

## SMM-Панель: Специфические Домены (16-20)

> Эти домены покрывают **уникальные векторы атак SMM-панели**, которые не описаны ни в одном стандарте OWASP. Они основаны на реальной архитектуре Smmplan и специфике SMM-индустрии.

---

### 🔴 ДОМЕН 16: Provider API Security (Утечка ключей и SSRF через провайдеров)
**Уникально для SMM-панелей**

SMM-панель хранит API-ключи десятков сторонних провайдеров (SmmWorld, JustAnotherPanel и т.д.). Это делает её prime target для атак на цепочку поставок.

**Что искать:**
- API-ключи провайдеров в plaintext в DB или логах
- Provider API URL хранится в DB без валидации → SSRF через кастомный провайдер
- Расшифрованные ключи утекают в API response (admin endpoints)
- При добавлении провайдера нет проверки URL на internal IPs
- Провайдер может вернуть вредоносный ответ (XSS в имени сервиса)

**Как проверять:**
```bash
# Проверить, что ключи шифруются при сохранении
grep -rn "CryptoService\.encrypt\|CryptoService\.encryptJson" src/ --include="*.ts"

# Проверить, что ключи НЕ возвращаются в API responses
grep -rn "apiKey\|apiUrl\|secretKey\|botToken" src/app/api/admin/ --include="*.ts" | grep -i "json\|return\|response"

# Проверить валидацию URL провайдера при создании
grep -rn "apiUrl\|provider.*url" src/app/api/admin/providers/ --include="*.ts"

# Проверить sanitization ответа провайдера
grep -rn "providerResponse\|\.name\|s\.name" src/services/providers/ --include="*.ts" | grep -v "sanitize\|escape"
```

**Архитектура Smmplan:**
```
DB → CryptoService.encrypt(apiKey) → зашифрованный ключ в DB
DB → CryptoService.decrypt(apiKey) → расшифровка только в runtime для API-вызова
```

**✅ Правильный паттерн:**
```typescript
// При создании провайдера — валидация URL
const url = new URL(apiUrl);
if (['127.0.0.1', 'localhost', '0.0.0.0', '169.254.169.254'].includes(url.hostname)) {
    throw new Error('Invalid provider URL');
}

// API response — НИКОГДА не возвращать расшифрованный ключ
return NextResponse.json({
    id: provider.id,
    name: provider.name,
    apiUrl: provider.apiUrl,
    hasApiKey: !!provider.apiKey, // Boolean, не значение!
    isEnabled: provider.isEnabled
});
```

---

### 🔴 ДОМЕН 17: Reseller API Abuse (Публичный API v2)
**Уникально для SMM-панелей**

SMM-панели предоставляют стандартизированный API (совместимый с Perfect Panel/FLAVOR) для реселлеров. Это полноценный публичный endpoint с формой оплаты через баланс — основная цель для злоупотреблений.

**Что искать:**
- Отсутствие rate-limiting на `/api/v2` (бот может создать тысячи заказов/сек)
- API key передаётся в body, а не в header → утечка через логи/referrer
- `action=services` выдаёт `costPrice` / `lastProviderPrice` (раскрытие маржи)
- Mass-order без лимита количества items в одном запросе
- `error.message` от внутренних ошибок утекает через V2 API
- Order status polling без rate-limit → enumeration attack
- `action=add` без проверки minQty/maxQty (заказ с quantity=1 или quantity=999999999)

**Как проверять:**
```bash
# Rate limiting на V2
grep -rn "checkRateLimit\|rateLimit" src/app/api/v2/ --include="*.ts"

# Утечка себестоимости через API
grep -rn "lastProviderPrice\|costPrice\|rawPrice\|markup" src/app/api/v2/ --include="*.ts"

# Лимиты quantity
grep -rn "minQty\|maxQty\|quantity" src/app/api/v2/ --include="*.ts"

# Error messages
grep -rn "err\.message\|error\.message" src/app/api/v2/ --include="*.ts"
```

**Архитектура Smmplan** (файл: `src/app/api/v2/route.ts`):
```
POST /api/v2 { key, action, service, link, quantity }
→ auth by apiKey (user.apiKey)
→ action routing: balance | services | add | status
```

**✅ Правильный паттерн:**
```typescript
// 1. Rate limit на V2 API
const rateLimit = await checkRateLimit('api_v2', `v2:${user.id}`);
if (!rateLimit.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

// 2. НИКОГДА не отдавать costPrice/lastProviderPrice в services response
return NextResponse.json(services.map(s => ({
    service: s.numericId,
    name: s.name,
    rate: s.pricePer1000.toNumber(), // Retail price only
    min: s.minQty,
    max: s.maxQty
    // НЕТ: costPrice, lastProviderPrice, rawPrice, markup
})));

// 3. Валидация quantity
if (quantity < service.minQty || quantity > service.maxQty) {
    return { error: `Quantity must be between ${service.minQty} and ${service.maxQty}` };
}

// 4. Catch без утечки деталей
catch (err: any) {
    return NextResponse.json({ error: 'Order processing failed' }, { status: 400 }); // Не err.message!
}
```

---

### 🟠 ДОМЕН 18: Price Manipulation и Financial Integrity
**Уникально для SMM-панелей**

В SMM-панели цена — это сложная формула: `costPrice × (1 + markupPercent) + fixedMarkup`, с учётом курсов валют и project-specific overrides. Любая ошибка в этой цепочке = прямые финансовые потери.

**Что искать:**
- Client-side передаёт `price` или `totalPrice` в body, а сервер доверяет ему
- Отрицательная quantity → отрицательная цена → кредитование баланса
- Overflow/underflow в Decimal-расчётах (Decimal.js)
- Markup = 0 или отрицательный → продажа ниже себестоимости
- Race condition: цена обновилась между корзиной и оплатой (TOCTOU)
- `customPrice` override в проекте без нижнего лимита (ниже costPrice)

**Как проверять:**
```bash
# Клиент передаёт цену?
grep -rn "body\.price\|body\.totalPrice\|body\.cost" src/app/api/client/ --include="*.ts"

# Проверка отрицательных значений
grep -rn "quantity.*<.*0\|quantity.*<=.*0\|quantity.*negative" src/ --include="*.ts"

# Safety price check (цена >= себестоимости)
grep -rn "safetyPrice\|getSafetyPrice\|costPrice.*compare\|costPrice.*gt\|costPrice.*gte" src/services/ --include="*.ts"

# Markup validation
grep -rn "markupPercent\|fixedMarkup" src/ --include="*.ts" | grep -v "type\|interface"

# CustomPrice override без лимита
grep -rn "customPrice\|overridePrice" src/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// 1. НИКОГДА не доверять клиентской цене — всегда пересчитывать на сервере
const pricePerUnit = service.pricePer1000; // Из DB, не из body!
const totalPrice = pricePerUnit.mul(quantity).div(service.priceUnit);

// 2. Валидация quantity
if (quantity <= 0 || !Number.isInteger(quantity)) throw new Error('Invalid quantity');
if (quantity < service.minQty || quantity > service.maxQty) throw new Error('Quantity out of range');

// 3. Safety price: никогда не продавать ниже себестоимости
const safetyPrice = PricingService.getSafetyPrice(costPrice);
if (newPrice.lt(safetyPrice)) newPrice = safetyPrice;
```

---

### 🟠 ДОМЕН 19: Telegram MiniApp (TMA) Authentication
**Уникально для SMM-панелей с Telegram Bot**

Telegram MiniApp использует `initData` для аутентификации. Это base64-encoded payload, подписанный bot token. Если верификация слабая — полный account takeover через подделку initData.

**Что искать:**
- `initData` обрабатывается без HMAC-верификации подписи
- Bot token хранится в plaintext (нужен для проверки подписи)
- `tgId` из initData используется без привязки к `projectId` → cross-project auth
- Отсутствие проверки `auth_date` (replay attack: старый initData)
- Пользователь создаётся автоматически по tgId без дополнительных проверок

**Как проверять:**
```bash
# Найти все TMA endpoints
find src/app/api/tma -name "route.ts"

# Проверить верификацию initData
grep -rn "validateProjectTMAData\|verifyTelegramAuth\|initData" src/app/api/tma/ --include="*.ts"

# Проверить, что auth_date проверяется
grep -rn "auth_date\|authDate" src/utils/tma-auth.ts --include="*.ts"

# Проверить привязку к projectId
grep -rn "projectId\|project\.id" src/app/api/tma/ --include="*.ts"

# Bot token хранение
grep -rn "botToken" src/utils/tma-auth.ts src/services/core/ --include="*.ts"
```

**Архитектура Smmplan:**
```
TMA Request → initData header → validateProjectTMAData(initData, projectSlug)
→ Расшифровка botToken из DB (CryptoService.decrypt)
→ HMAC-SHA256 верификация подписи
→ Извлечение tgId → findOrCreate user
```

**✅ Правильный паттерн:**
```typescript
// 1. Всегда верифицировать initData через HMAC
const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
const checkHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
if (checkHash !== hash) throw new Error('Invalid TMA signature');

// 2. Проверить auth_date (максимум 24 часа)
const authDate = parseInt(params.get('auth_date') || '0');
if (Date.now() / 1000 - authDate > 86400) throw new Error('TMA data expired');

// 3. Привязка к проекту
const user = await prisma.user.findFirst({
    where: { tgId: BigInt(tgId), projectId: project.id } // projectId scoping!
});
```

---

### 🟡 ДОМЕН 20: Order Queue и Provider Dispatch Exploitation
**Уникально для SMM-панелей**

SMM-панель — это посредник: принимает заказ от клиента → отправляет провайдеру → мониторит статус. Каждый этап имеет уникальные векторы атак.

**Что искать:**
- Order bombardment: массовые заказы с разных аккаунтов на один провайдер → DDoS провайдера → бан аккаунта панели
- Cancel/refund fraud: отмена заказа когда провайдер уже выполнил → двойной профит
- Status polling loop: бесконечный цикл проверки статуса заказов → CPU exhaustion
- Provider response injection: провайдер возвращает XSS в status message
- Churn monitoring: утечка данных о чужих заказах через churn endpoint
- Drip-feed abuse: создание drip-feed с 999999 runs × 100 quantity → обход лимитов

**Как проверять:**
```bash
# Лимиты на создание заказов
grep -rn "MAX_ORDERS\|maxOrders\|orderLimit\|ordersPerDay" src/ --include="*.ts"

# Refund/cancel flow
grep -rn "cancel\|refund\|CANCELED\|PARTIAL" src/services/orders/ --include="*.ts"

# Provider response sanitization
grep -rn "providerOrderId\|externalId\|providerStatus" src/services/ --include="*.ts" | grep -v "sanitize"

# Drip-feed limits
grep -rn "dripFeed\|isDripFeed\|runs\|interval" src/ --include="*.ts"

# Monitor polling intervals
grep -rn "setInterval\|cron\|schedule\|monitor" src/services/orders/ --include="*.ts"
```

**✅ Правильный паттерн:**
```typescript
// 1. Daily order limit per user
const todayOrders = await prisma.order.count({
    where: { userId, createdAt: { gte: startOfDay } }
});
if (todayOrders >= MAX_DAILY_ORDERS) throw new Error('Daily order limit reached');

// 2. Sanitize provider response
const sanitizedStatus = String(providerResponse.status).replace(/[<>'"&]/g, '');

// 3. Drip-feed validation
if (isDripFeed) {
    if (runs > 100) throw new Error('Max 100 drip-feed runs');
    if (interval < 1) throw new Error('Min interval is 1 minute');
}

// 4. Атомарный refund (не двойной)
const refundResult = await tx.order.updateMany({
    where: { id: orderId, status: 'IN_PROGRESS', refunded: false }, // Atomic check
    data: { status: 'CANCELED', refunded: true }
});
if (refundResult.count === 0) throw new Error('Order already refunded or completed');
```

---

## Реестр уязвимостей (Smmplan, март 2026)

| ID | Домен | Severity | CWE | Описание | Статус |
|----|-------|----------|-----|----------|--------|
| VULN-1 | Auth | 🔴 CRITICAL | CWE-306 | Account Takeover: Zero-Friction Auth | ✅ Fixed |
| VULN-2 | Info Disclosure | 🔴 CRITICAL | CWE-200 | Debug endpoints без аутентификации | ✅ Fixed |
| VULN-3 | IDOR | 🟠 HIGH | CWE-639 | Churn stats без проверки владельца | ✅ Fixed |
| VULN-4 | DoS | 🟠 HIGH | CWE-770 | Unbounded pagination (4 точки) | ✅ Fixed |
| VULN-5 | Headers | 🟠 HIGH | CWE-693 | HSTS отключён + нет CSP | ✅ Fixed |
| VULN-6 | Fail-Open | 🟠 HIGH | CWE-636 | Rate limiter пропускает без Redis | ✅ Fixed |
| VULN-7 | Webhook | 🟡 MEDIUM | CWE-345 | IP spoofing x-forwarded-for | ✅ Documented |
| VULN-8 | Tenant | 🟡 MEDIUM | CWE-284 | mock_tenant bypass в staging | ✅ Fixed |
| SMM-1 | V2 API | 🟠 HIGH | CWE-209 | err.message утечка в Reseller API | ✅ Fixed |
| SMM-2 | V2 API | 🟠 HIGH | CWE-770 | Нет rate-limit на /api/v2 | ✅ Fixed |
| SMM-3 | Providers | 🟡 MEDIUM | CWE-200 | apiKey утечка через ...spread в GET | ✅ Fixed |
| SMM-4 | Orders | 🟡 MEDIUM | CWE-770 | drip-feed runs без верхнего лимита | ✅ Fixed |
| SMM-5 | Providers | 🟢 LOW | CWE-269 | SUPPORT может управлять провайдерами | ✅ Fixed |

---

## Changelog
- **v3.0** (31.03.2026): Добавлены 5 SMM-специфичных доменов (16-20): Provider API Security, Reseller API Abuse, Price Manipulation, TMA Auth, Order Queue Exploitation. Итого 20 доменов.
- **v2.0** (31.03.2026): Расширение с 8 до 15 доменов. Добавлены: Next.js CVE, Prototype Pollution, SSRF, Race Conditions, Supply Chain, AI/LLM Security, Cryptography. Обновлены стандарты до OWASP ASVS v5.0 и CWE Top 25 (2025).
- **v1.0** (31.03.2026): Первая версия на основе реального аудита Smmplan. 8 доменов.

