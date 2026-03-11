---
name: qa_agent
description: Comprehensive QA Agent skill for autonomous testing of the Smmplan project. Contains project context, testing conventions, mock patterns, test registry, and step-by-step procedures.
---

# QA Agent — Skill for Autonomous Testing

This skill provides everything an AI testing agent needs to autonomously run, analyze, and write tests for the Smmplan project. Read this document fully before performing any testing actions.

## 1. Project Context

- **Framework**: Next.js 16.x (App Router, Server Components, Server Actions)
- **Language**: TypeScript 5.7+ (strict mode)
- **Test Runner**: Jest (via `next/jest`) with `node` environment
- **ORM**: Prisma (PostgreSQL)
- **Auth**: `next-auth` v5
- **State**: Server Actions (no REST API for admin, API routes for client/bot/external)
- **Queue**: BullMQ (Redis-backed)
- **Bot**: Telegraf (Telegram bot with Wizard scenes)

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin panel (Server Components + Actions)
│   ├── (client)/           # Client-facing pages
│   └── api/                # API routes (auth, webhooks, client, tma, v1, v2)
├── services/               # Business logic layer (15 modules)
│   ├── orders/             # Order lifecycle, drip-feed, mass, scheduled, refund, sync
│   ├── providers/          # Provider API, sync, failover, balance monitor
│   ├── finance/            # Pricing engine, currency, ledger, reconciliation
│   ├── payments/           # Unified payment, YooKassa, Robokassa
│   ├── users/              # Loyalty, safety, promo, referral, prediction
│   ├── core/               # Link analyzer, self-healing, settings
│   ├── admin/              # Service engine, log, 2FA
│   ├── security/           # Financial security
│   ├── ai/                 # Description generator
│   ├── churn/              # Churn prediction
│   ├── gamification/       # Achievements, challenges
│   ├── advocacy/           # NPS, UGC
│   ├── support/            # Ticket system
│   └── vip/                # VIP guardian
├── bot/                    # Telegram bot (Telegraf + Wizard scenes)
├── workers/                # BullMQ workers
├── utils/                  # Utility functions
├── lib/                    # Core libraries (prisma, auth, bot, logger)
└── tests/                  # Integration & E2E tests
```

### Key Config Files
- `jest.config.js` — Jest configuration with path aliases and ESM transform
- `jest.setup.js` — Setup file (runs before tests)
- `tsconfig.json` — TypeScript config with `@/` path alias to `src/`

---

## 2. Testing Conventions

### 2.1 File Naming
- **Unit tests**: Place next to the source file: `service-name.test.ts`
- **Integration tests**: Place in `src/tests/`: `feature-name.test.ts`
- **E2E tests**: Place in `src/tests/e2e/` (excluded from default `jest` run)

### 2.2 Test Structure
```typescript
/**
 * @jest-environment node
 */
import { ServiceUnderTest } from '@/services/module/service-name';

// 1. Mock dependencies BEFORE imports (hoisted by Jest)
jest.mock('@/lib/prisma', () => ({ prisma: { /* mock methods */ } }));
jest.mock('@/lib/bot', () => ({ bot: { telegram: { sendMessage: jest.fn() } } }));

describe('ServiceUnderTest', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('methodName', () => {
    test('should [expected behavior] when [condition]', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2.3 Mock Patterns

#### Prisma Mock (Unit Tests)
```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalPrice: null } }),
    },
    $transaction: jest.fn((fns) => Promise.all(fns)),
    // ... add models as needed
  },
}));
```

#### Prisma Real (Integration Tests)
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

afterAll(async () => {
  // ALWAYS clean up test data
  await prisma.order.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.$disconnect();
});
```

#### Provider Service Mock
```typescript
jest.mock('@/services/providers/provider.service');
(ProviderService.createOrder as jest.Mock).mockResolvedValue({
  success: true,
  externalId: 'ext_123',
  providerName: 'TestProvider',
});
(ProviderService.getOrderStatus as jest.Mock).mockResolvedValue({
  status: 'Completed',
  remains: 0,
  cost: 0.1,
});
```

#### Bot Mock (Prevent Side Effects)
```typescript
jest.mock('@/lib/bot', () => ({
  bot: { telegram: { sendMessage: jest.fn().mockResolvedValue({}) } },
}));
```

#### Next.js Mocks (Server Actions)
```typescript
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn().mockReturnValue({
      value: JSON.stringify({ role: 'ADMIN', id: 'admin-id', isGlobalAdmin: true })
    }),
    has: jest.fn().mockReturnValue(true),
  })),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
```

### 2.4 Assertion Patterns
- Use `expect().toBe()` for primitives
- Use `expect().toEqual()` for objects
- Use `expect().toBeInstanceOf(ZodError)` for validation errors
- Use `expect().toHaveBeenCalledWith()` for mock verification
- Use `expect().toMatchObject()` for partial object matching
- Always check both **success** and **failure** paths

---

## 3. Agent Procedures

### Procedure A: Full Test Run (Default)

When the user says **"проведи тестирование"**, follow these steps:

1. **Read this skill**: You are already doing this.
2. **Read the test registry**: `view_file .agent/skills/qa_agent/test-registry.md`
3. **Check recent changes**: Run `git diff --name-only HEAD~5` to see what changed recently.
4. **Run all existing tests**:
   ```bash
   npx jest --passWithNoTests --forceExit --detectOpenHandles 2>&1
   ```
5. **Analyze results**:
   - If tests **PASS** ✅: Proceed to Step 6 (Coverage Analysis).
   - If tests **FAIL** ❌: Fix the failing tests FIRST. Determine if the failure is:
     - a) **Broken test** (test code is wrong) → Fix the test
     - b) **Broken implementation** (code changed, test reflects real bug) → Report to user, do NOT blindly fix
6. **Coverage Analysis**: Cross-reference changed files with the test registry. Identify any changed **service** or **action** that lacks test coverage.
7. **Write new tests**: For uncovered changed files, write tests following the conventions in Section 2.
8. **Run all tests again**: Confirm everything passes.
9. **Report**: Output a structured report (see Section 4).

### Procedure B: Targeted Test Run

When the user says **"протестируй [модуль]"** (e.g., "протестируй заказы"):

1. Read this skill and the test registry.
2. Identify the module path (e.g., `src/services/orders/`).
3. Run only relevant tests:
   ```bash
   npx jest --testPathPattern="orders" --passWithNoTests --forceExit 2>&1
   ```
4. Analyze, fix, extend, report.

### Procedure C: Post-Change Verification

When the user says **"проверь после изменений"**:

1. Run `git diff --staged --name-only` to see staged changes.
2. Map changed files to test files from the registry.
3. Run only affected tests.
4. If any changed file has NO test → write one.
5. Report.

---

## 4. Report Format

After completing testing, generate this report:

```markdown
## 🧪 Отчет о тестировании

**Дата**: [дата]
**Режим**: [Полный / Таргетированный / По изменениям]

### Результаты прогона
- ✅ Пройдено: X тестов
- ❌ Провалено: Y тестов  
- ⏭️ Пропущено: Z тестов
- 📊 Покрытие: ~XX% (lines)

### Обнаруженные проблемы
| # | Файл | Проблема | Критичность | Статус |
|---|------|---------|-------------|--------|
| 1 | file.ts | Описание | 🔴/🟡/🟢 | Исправлено / Требует внимания |

### Новые тесты (написано)
- `src/services/module/service.test.ts` — X тестов для [описание]

### Рекомендации
- [Рекомендации по улучшению покрытия]
```

---

## 5. Critical Rules

1. **NEVER delete or modify existing test assertions** without understanding WHY they exist. If a test fails after code changes, the test might be catching a real bug.
2. **ALWAYS clean up test data** in `afterAll` or `afterEach` blocks when using real Prisma.
3. **ALWAYS mock `@/lib/bot`** to prevent Telegram messages during tests.
4. **ALWAYS mock `next/headers`** and `next/cache` when testing Server Actions.
5. **NEVER hardcode UUIDs or timestamps** — use `Date.now()` or `crypto.randomUUID()` for test entity IDs.
6. **Use `jest.setTimeout(60000)`** for integration tests that hit the real database.
7. **Respect the Ralph Loop v3**: After writing tests, run a full build (`npm run build`) only if structural changes were made to verify type safety.
8. **Multi-project isolation**: When testing any feature that touches `projectId`, always test BOTH global admin and project-scoped scenarios.

---

## 6. Security Testing (ОБЯЗАТЕЛЬНО)

> **Reference**: Read the security hardening KI at `knowledge/security_and_authorization_hardening/` for full context.
> All security tests MUST be part of every Full Test Run (Procedure A).

### 6.1 Security Vectors to Test

The project has 5 critical security layers. Each MUST have test coverage:

#### Vector 1: Server Action Authorization (RBAC)
Every Server Action in `src/app/admin/*/actions.ts` MUST verify the caller's identity.

**What to test:**
- Action called WITHOUT session → must throw `Unauthorized`
- Action called with `SUPPORT` role → must be denied for admin-only actions (e.g., `adjustBalanceAction`)
- Action called with `SEO` role → must only allow content edits, NOT price changes
- Action called with `ADMIN` (non-global) → must be denied from creating other `ADMIN` users
- Action called with `isGlobalAdmin: true` → must succeed for all operations

**Pattern:**
```typescript
test('should reject SUPPORT role from adjusting balance', async () => {
  mockCookies.get.mockReturnValue({ 
    value: JSON.stringify({ role: 'SUPPORT', id: 'support-id' }) 
  });
  await expect(adjustBalanceAction('user-id', 100, 'test'))
    .rejects.toThrow('Unauthorized');
});
```

#### Vector 2: Payment Webhook Verification
Webhooks at `/api/webhooks/yookassa/` and `/api/webhooks/robokassa/` must NOT blindly trust incoming payloads.

**What to test:**
- Webhook with valid signature + matching API status → payment confirmed
- Webhook with valid signature but MISMATCHED API status → payment flagged for review
- Webhook with INVALID/missing signature → rejected immediately
- Replay attack (same `externalId` sent twice) → second call ignored (idempotency)
- Negative or zero amount in payload → rejected

#### Vector 3: Financial Security (Slippage Detection)
Service: `src/services/security/financial-security.service.ts`

**What to test:**
- `getProviderSlippage()`: Provider spent MORE than expected → status `WARNING` or `CRITICAL`
- `getProviderSlippage()`: Provider spent within threshold → status `OK`
- `analyzeUserLTV()`: User balance exceeds expected inflow → `riskScore > 0`
- `analyzeUserLTV()`: Normal user with matching balance → `riskScore === 0`
- Edge: Provider with zero orders but spent balance → `CRITICAL`

#### Vector 4: Multi-Project Data Isolation
**What to test:**
- Admin of Project A cannot see users of Project B
- Admin of Project A cannot modify orders of Project B
- Global Admin CAN see all projects
- `getActiveProjectId()` returns correct project based on cookie/context
- API routes filter by `projectId` correctly

#### Vector 5: Bot HTML Injection Prevention
**What to test:**
- User with `<script>` in username → HTML escaped in bot messages
- User with `<b>bold</b>` in bio → tags escaped, not rendered
- System-generated `<b>`, `<i>` tags → preserved (only system tags allowed)

### 6.2 Security Test File Location
- Unit security tests: `src/services/security/financial-security.service.test.ts`
- Server Action auth tests: `src/tests/security-rbac.test.ts`
- Webhook verification: `src/tests/webhook-security.test.ts`
- Isolation tests: `src/tests/project-isolation.test.ts`

---

## 7. E2E Testing (Playwright)

### 7.1 Infrastructure
- **Runner**: Playwright (`@playwright/test`)
- **Location**: `src/tests/e2e/*.spec.ts`
- **Excluded** from default `npx jest` run (Jest config ignores `.spec.ts`)
- **Run command**: `npx playwright test`

### 7.2 Existing E2E Specs
| File | What it tests | Status |
|---|---|---|
| `e2e/auth.spec.ts` | Admin login page, 2FA prompt, tab switching | ✅ Basic |
| `e2e/finance.spec.ts` | Ledger entry creation, balance tracking | ⚠️ Scaffold |

### 7.3 Missing E2E Scenarios (Priority Order)

| # | Scenario | Priority | Description |
|---|---|---|---|
| 1 | **Admin Login → Dashboard** | 🔴 | Full auth flow: login → 2FA → redirect to dashboard |
| 2 | **Service Import → Order** | 🔴 | Import service from provider → create order → verify in orders list |
| 3 | **Payment → Balance Update** | 🔴 | Create payment → webhook confirmation → balance credited |
| 4 | **User Management** | 🟡 | Create user → edit → ban → verify state transitions |
| 5 | **Provider CRUD** | 🟡 | Add provider → sync services → verify count |
| 6 | **Client Dashboard** | 🟡 | Login as client → view services → place order → check history |
| 7 | **Bot Flow Simulation** | 🟢 | Simulate Telegram Mini App order flow via TMA API |
| 8 | **Multi-Project Switch** | 🟢 | Admin switches between projects → data changes correctly |

### 7.4 E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeAll(async () => {
    // Setup test data in DB via Prisma (NOT via UI)
  });

  test('should [behavior]', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test.afterAll(async () => {
    // Clean up test data
  });
});
```

### 7.5 When to Run E2E
- **Always** after major feature changes
- **Before** production deployments
- **On demand** with: `npx playwright test`
- **Targeted**: `npx playwright test e2e/auth.spec.ts`

---

## 8. Advanced Testing Types (World Standards 2025-2026)

> Full research: see `testing_research.md` artifact for detailed analysis.

When the agent has **completed basic coverage**, introduce these advanced types:

### 8.1 Contract Testing (`Pact` + Jest)
- **When**: Provider API changes, webhook format validation
- **Where**: `src/tests/contracts/`
- **Install**: `npm install -D @pact-foundation/pact`

### 8.2 Property-Based Testing (`fast-check`)
- **When**: Financial logic (pricing, balance, currency conversion)
- **Where**: Alongside existing service tests
- **Install**: `npm install -D fast-check`
- **Pattern**: Define invariants (e.g., "price always > cost"), framework generates 1000+ random inputs

### 8.3 Mutation Testing (`Stryker`)
- **When**: After stabilizing tests, to measure real test effectiveness
- **Run**: `npx stryker run`
- **Install**: `npm install -D @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker`
- **Target**: Mutation score > 50% (Phase 1), > 70% (Phase 3)

### 8.4 Load Testing (`k6`)
- **When**: Before scaling, mass orders, webhook storm simulation
- **Where**: `tests/load/` (separate from Jest)
- **Install**: k6 CLI (https://k6.io)

### 8.5 Snapshot Testing (Jest built-in)
- **When**: API v2 response format, complex data structures
- **Pattern**: `expect(response).toMatchSnapshot()`

### 8.6 Visual Regression (Playwright built-in)
- **When**: CSS refactoring, design system changes
- **Pattern**: `await expect(page).toHaveScreenshot()`
