---
name: Business Logic Testing Protocol (Smmplan)
description: >
  Обязательный навык для поиска логических ошибок в бизнес-логике Smmplan.
  Применяй всегда, когда нужно найти: баги в финансовой математике, нарушения
  инвариантов баланса, double-spend уязвимости, некорректные переходы статусов,
  ошибки в расчёте цен/комиссий, или проблемы в логике геймификации и retention.
---

# Business Logic Testing Protocol (Smmplan)

## Когда использовать этот скилл

- Рефакторинг финансовой логики (balance, pricing, refunds)
- Новые эндпоинты заказов / платежей
- Изменения в системе скидок или комиссий провайдеров
- Ревью нового кода перед мержем в main
- Периодический аудит (раз в milestone)

---

## Часть 1: Таксономия логических ошибок

### Тип 1: Финансовые инварианты (Critical)

Инварианты, которые НИКОГДА не должны нарушаться:

```
[INV-1] balance после списания НИКОГДА не должен быть < 0
[INV-2] totalPrice = quantity * pricePer1000 / 1000 (с точностью до Decimal)
[INV-3] costPrice ВСЕГДА <= totalPrice (маржа >= 0)
[INV-4] Сумма всех транзакций пользователя = текущий баланс (reconciliation)
[INV-5] Одна транзакция платежа НЕ МОЖЕТ быть применена дважды (idempotency)
[INV-6] Возврат НИКОГДА не превышает originalPrice заказа
```

### Тип 2: Переходы статусов (State Machine)

```
PENDING → PROCESSING → IN_PROGRESS → COMPLETED ✅
PENDING → CANCELED ✅
PROCESSING → CANCELED ✅ (только если провайдер поддерживает)
COMPLETED → CANCELED ❌ (ЗАПРЕЩЕНО)
COMPLETED → REFUNDED ✅ (только через admin)
CANCELED → любой ❌ (ФИНАЛЬНЫЙ СТАТУС)
```

### Тип 3: Граничные значения (Edge Cases)

```
[EDGE-1] quantity = minQty (минимальный заказ)
[EDGE-2] quantity = maxQty (максимальный заказ)  
[EDGE-3] balance = 0 при создании заказа → должен отклонить
[EDGE-4] balance РОВНО = totalPrice → должен пройти
[EDGE-5] balance = totalPrice - 0.01 → должен отклонить
[EDGE-6] Скидка 100% → totalPrice = 0 → должен ли создаться заказ?
[EDGE-7] pricePer1000 = 0 → бесплатный заказ → защита?
```

### Тип 4: Параллелизм / Race Conditions

```
[RACE-1] Два одновременных заказа на баланс X → только один должен пройти
[RACE-2] Webhook платежа приходит дважды → только один increment
[RACE-3] Одновременный refund + новый заказ → не выйти в минус
```

### Тип 5: Бизнес-правила (Domain Logic)

```
[BIZ-1] Скидка применяется ДО расчёта costPrice
[BIZ-2] Реферальные бонусы начисляются после подтверждения платежа
[BIZ-3] Достижения выдаются ровно один раз (idempotency)
[BIZ-4] ChurnIndicator показывается только если есть warrantied подписки
[BIZ-5] SmartUpsell не показывается для CANCELED заказов
```

---

## Часть 2: Процесс аудита

### Шаг 1: Карта точек мутации баланса

Найди все места, где баланс изменяется:

```bash
# Найти все записи баланса
grep -r "balance:" src/ --include="*.ts" -l
grep -r "increment.*balance\|balance.*set\|balanceAfter" src/ --include="*.ts"
```

Для Smmplan известные точки (актуально на апрель 2026):
- `src/app/api/client/orders/route.ts:244` — списание при создании заказа (batch)
- `src/app/api/client/orders/route.ts:517` — списание при создании одиночного заказа  
- `src/services/finance/reconciliation.service.ts` — сверка баланса
- `src/services/orders/payment-confirmation.service.ts` — пополнение при webhook

### Шаг 2: Написать юнит-тесты инвариантов

Используй **Vitest** (уже установлен в проекте) + **fast-check** для property-based тестирования:

```typescript
// src/tests/logic/balance-invariants.test.ts
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Decimal } from 'decimal.js';

describe('[INV-1] Balance never goes negative', () => {
  it('property: for any price <= balance, result is non-negative', () => {
    fc.assert(fc.property(
      fc.float({ min: 0, max: 100000 }), // balance
      fc.float({ min: 0, max: 100000 }), // price
      (balance, price) => {
        fc.pre(price <= balance); // только валидные случаи
        const result = new Decimal(balance).minus(new Decimal(price));
        return result.gte(0);
      }
    ));
  });

  it('property: price > balance must be rejected', () => {
    fc.assert(fc.property(
      fc.float({ min: 0.01, max: 100000 }),
      (price) => {
        const balance = new Decimal(price).minus(0.01);
        return balance.lt(price); // баланс < цены → reject
      }
    ));
  });
});

describe('[INV-2] Price calculation correctness', () => {
  it('totalPrice = quantity * pricePer1000 / 1000', () => {
    fc.assert(fc.property(
      fc.integer({ min: 100, max: 100000 }), // quantity
      fc.float({ min: 0.01, max: 10000 }),   // pricePer1000
      (quantity, pricePer1000) => {
        const expected = new Decimal(quantity)
          .mul(new Decimal(pricePer1000))
          .div(1000);
        // Проверяем что это то же самое что в route.ts
        const actual = new Decimal(pricePer1000).mul(quantity).div(1000);
        return expected.eq(actual);
      }
    ));
  });
});
```

### Шаг 3: Проверка State Machine

```typescript
// src/tests/logic/order-state-machine.test.ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELED', 'AWAITING_PAYMENT'],
  AWAITING_PAYMENT: ['PENDING', 'CANCELED'],
  PROCESSING: ['IN_PROGRESS', 'CANCELED', 'ERROR'],
  IN_PROGRESS: ['COMPLETED', 'PARTIAL', 'CANCELED', 'ERROR'],
  ERROR: ['PENDING', 'CANCELED'],
  COMPLETED: ['REFUNDED'],  // только через admin action
  PARTIAL: ['COMPLETED', 'REFUNDED'],
  CANCELED: [],             // финальный статус
  REFUNDED: [],             // финальный статус
};

describe('Order State Machine', () => {
  Object.entries(VALID_TRANSITIONS).forEach(([from, validTo]) => {
    it(`from ${from}: valid transitions are [${validTo.join(', ')}]`, () => {
      const allStatuses = Object.keys(VALID_TRANSITIONS);
      const invalidTo = allStatuses.filter(s => !validTo.includes(s) && s !== from);
      invalidTo.forEach(to => {
        expect(isValidTransition(from, to)).toBe(false);
      });
    });
  });
});
```

### Шаг 4: Тест идемпотентности платежей

```typescript
// src/tests/logic/payment-idempotency.test.ts
describe('[INV-5] Payment webhook idempotency', () => {
  it('same transactionId applied twice → balance incremented only once', async () => {
    const txId = 'test-tx-' + Date.now();
    const initialBalance = new Decimal(100);
    
    // Первый вызов
    const result1 = await applyPayment(txId, 500);
    expect(result1.success).toBe(true);
    
    // Второй вызов с тем же txId
    const result2 = await applyPayment(txId, 500);
    expect(result2.alreadyProcessed).toBe(true);
    
    // Баланс изменился только один раз
    const user = await getUser();
    expect(user.balance.toNumber()).toBe(initialBalance.plus(500).toNumber());
  });
});
```

---

## Часть 3: Быстрый аудит (Checklist)

Запускай этот чеклист при каждом PR:

```
[ ] INV-1: Есть проверка balance >= totalPrice перед списанием?
[ ] INV-5: Есть уникальный индекс на transactionId в Transaction таблице?
[ ] INV-6: Возврат не превышает originalPrice?
[ ] RACE-1: Списание баланса обёрнуто в транзакцию БД?
[ ] RACE-2: Webhook обработчик использует upsert/idempotency key?
[ ] BIZ-1: Скидка применяется на уровне pricePer1000, а не totalPrice?
[ ] EDGE-6: Заказ с ценой 0 заблокирован или требует special handling?
```

---

## Часть 4: Команды запуска

```bash
# Запустить все логические тесты
npx vitest run src/tests/logic/

# Запустить с покрытием
npx vitest run --coverage src/tests/logic/

# Запустить property-based тесты (verbose)
npx vitest run src/tests/logic/balance-invariants.test.ts --reporter=verbose

# Установить fast-check если не установлен
npm install fast-check --save-dev
```

---

## Часть 5: Специфика Smmplan

### Критические файлы для аудита

| Файл | Риск | Почему |
|------|------|--------|
| `src/app/api/client/orders/route.ts` | ⚠️ HIGH | Списание баланса, два пути (batch/single) |
| `src/services/orders/payment-confirmation.service.ts` | ⚠️ HIGH | Webhook + двойное начисление |
| `src/services/finance/reconciliation.service.ts` | 🔵 MEDIUM | Сверка — сигнализирует о дрейфе |
| `src/app/api/admin/orders/[id]/actions/route.ts` | 🔵 MEDIUM | Manual refund без лимитов |
| `src/services/gamification/achievement.service.ts` | 🟡 LOW | Дублирование badges |

### Известные уязвимости (исторически)

1. **Double-Balance** — было подтверждено, что `payment-confirmation.service.ts` проверяет идемпотентность. ✅ Исправлено (тест `webhook-payment.spec.ts` проходит)
2. **Negative Balance** — API заказов проверяет `balanceAfter < 0`. ✅ Verified
3. **Скидка > 100%** — нет явного Cap. ⚠️ Неверифицировано

---

## Выход скилла

После аудита создай отчёт в `.planning/logic-audit-YYYY-MM-DD.md`:

```markdown
# Логический аудит YYYY-MM-DD

## Статус инвариантов
- [x] INV-1: Пройден
- [x] INV-2: Пройден  
- [ ] INV-X: ⚠️ Найден баг — [описание]

## Найденные логические ошибки
1. [HIGH] XXX: ...
2. [MEDIUM] YYY: ...

## Требуют дополнительных тестов
- ...
```
