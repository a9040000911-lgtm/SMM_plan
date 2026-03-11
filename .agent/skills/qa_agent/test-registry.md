# Smmplan Test Registry

> This document maps every critical business module to its test files and identifies coverage gaps.
> The QA Agent uses this as the **source of truth** for deciding what to test, what to write, and what to prioritize.

---

## 🔴 Tier 1: CRITICAL (Financial + Order Lifecycle)

### Orders Module (`src/services/orders/`)

| Service File | Test File | Status | Notes |
|---|---|---|---|
| `order-processor.service.ts` | `tests/full_cycle.test.ts` | ✅ Covered | Payment → Order → Provider via mocks |
| `order-sync.service.ts` | `orders/order-sync.service.test.ts` | ✅ Covered | Status sync with multiple statuses |
| `order-refund.service.ts` | `orders/order-refund.service.test.ts` | ⚠️ Partial | Missing: partial refund, double refund edge cases |
| `payment-confirmation.service.ts` | `tests/webhook-security.test.ts` | ✅ Covered | YooKassa/Robokassa webhook processing |
| `drip-feed.service.ts` | — | ❌ **NO TESTS** | Drip-feed interval creation & execution |
| `mass-order.service.ts` | — | ❌ **NO TESTS** | Bulk order creation from multiple links |
| `scheduled-order.service.ts` | — | ❌ **NO TESTS** | Cron-triggered future orders |
| `order-queue.service.ts` | — | ❌ **NO TESTS** | BullMQ job processing, retry, timeout |
| `order-activation.service.ts` | — | ❌ **NO TESTS** | Order activation flow |
| `order-lifecycle.service.ts` | — | ❌ **NO TESTS** | State transitions |
| `order-financial.service.ts` | — | ❌ **NO TESTS** | Cost calculations |

### Finance Module (`src/services/finance/`)

| Service File | Test File | Status | Notes |
|---|---|---|---|
| `pricing.service.ts` | `tests/pricing.test.ts` | ✅ Covered | Ladder, overrides, project rules |
| `currency.service.ts` | `services/finance/currency.service.test.ts` | ✅ Covered | Rate fetching & conversion |
| `ledger.service.ts` | — | ❌ **NO TESTS** | Balance journal entries |
| `payment.service.ts` | `tests/webhook-security.test.ts` | ✅ Covered | Payment creation, status check |
| `reconciliation.service.ts` | — | ❌ **NO TESTS** | Financial reconciliation |

### Payments Module (`src/services/payments/`)

| Service File | Test File | Status | Notes |
|---|---|---|---|
| `unified-payment.service.ts` | — | ❌ **NO TESTS** | Auto-routing to YooKassa/Robokassa |
| All payment adapters | `tests/webhook-security.test.ts` | ✅ Covered | Webhook signature verification |

### Safety Module (`src/services/users/safety.service.ts`)

| Service File | Test File | Status | Notes |
|---|---|---|---|
| `safety.service.ts` | `users/safety.service.test.ts` | ✅ Covered | Margin guard: block loss, pass adequate margin |

---

## 🟡 Tier 2: HIGH (Provider, Auth, Multi-Project)

### Providers Module (`src/services/providers/`)

| Service File | Test File | Status | Notes |
|---|---|---|---|
| `provider.service.ts` | `providers/provider.service.test.ts` | ✅ Covered | Basic API interaction |
| `sync.service.ts` | `providers/sync.service.test.ts` | ✅ Covered | Service synchronization |
| `failover.service.ts` | `services/providers/failover.service.test.ts` | ✅ Covered | Automatic provider switching |
| `balance-monitor.service.ts` | — | ❌ **NO TESTS** | Low balance detection & alerts |
| `service-guardian.service.ts` | `tests/service_guardian.test.ts` | ✅ Covered | Price change detection |

### Auth & RBAC (`src/lib/auth.ts`, `src/app/admin/users/actions.ts`)

| Feature | Test File | Status | Notes |
|---|---|---|---|
| Admin auth (cookie-based) | `tests/foolproof.test.ts` | ⚠️ Partial | Covers SEO role restriction, validation |
| Telegram Mini App auth | `lib/telegram/auth.test.ts` | ✅ Covered | HMAC validation |
| Global Admin vs Project Admin | `tests/security-rbac-extended.test.ts` | ✅ Covered | Privilege escalation prevention |
| User login flow (NextAuth) | — | ❌ **NO TESTS** | Credentials provider, project scoping |

### Multi-Project Isolation

| Feature | Test File | Status | Notes |
|---|---|---|---|
| Data isolation (projectId filtering) | `tests/project-isolation.test.ts` | ✅ Covered | Verified cross-project data leak prevention |
| Service overrides per project | — | ❌ **NO TESTS** | `ProjectServiceOverride` logic |

---

## 🟢 Tier 3: MEDIUM (Utils, Bot, Link Analysis)

### Core Services (`src/services/core/`)

| Service File | Test File | Status | Notes |
|---|---|---|---|
| `link-analyzer.service.ts` | `core/link-analyzer.service.test.ts` | ✅ Covered | URL parsing, cleaning, platform detection |
| `self-healing.service.ts` | — | ❌ **NO TESTS** | Auto-recovery logic |
| `settings.service.ts` | — | ❌ **NO TESTS** | Project settings retrieval |

### Utilities (`src/utils/`)

| Utility File | Test File | Status | Notes |
|---|---|---|---|
| `formatter.ts` | `utils/formatter.test.ts` | ✅ Covered | Number formatting |
| `normalizer.ts` | `utils/normalizer.test.ts` | ✅ Covered | Text normalization |
| `analyzer.ts` | `utils/analyzer.test.ts` | ✅ Covered | Link analysis utils |
| `edge-cases.ts` | `utils/edge-cases.test.ts` | ✅ Covered | Edge case handling |
| `chaos.ts` | `utils/chaos.test.ts` | ✅ Covered | Chaos testing utils |

### Bot (`src/bot/`)

| Feature | Test File | Status | Notes |
|---|---|---|---|
| Bot initialization | `bot/bot.test.ts` | ⚠️ Partial | Basic setup only |
| Wizard scenes (Order flow) | — | ❌ **NO TESTS** | Scene transitions, state management |

---

## 🛡️ Security Tests

### Server Action RBAC (`src/tests/security-rbac-extended.test.ts`)

| Scenario | Test File | Status | Notes |
|---|---|---|---|
| SEO denied price changes | `tests/foolproof.test.ts` | ✅ Covered | Price lock verified |
| Non-global ADMIN denied ADMIN creation | `tests/security-rbac-extended.test.ts` | ✅ Covered | Critical privilege escalation gap |
| Global Admin full access | `tests/security-rbac-extended.test.ts` | ✅ Covered | Baseline positive case |

### Payment Webhook Security (`src/tests/webhook-security.test.ts`)

| Scenario | Test File | Status | Notes |
|---|---|---|---|
| Valid signature + matching API status | `tests/webhook-security.test.ts` | ✅ Covered | Happy path |
| Valid signature + mismatched API status | `tests/webhook-security.test.ts` | ✅ Covered | Blocks confirmation |
| Invalid/missing signature | `tests/webhook-security.test.ts` | ✅ Covered | Rejects immediately (400) |
| Double confirmation prevention | `tests/webhook-security.test.ts` | ✅ Covered | Transaction safe guard |

### Multi-Project Isolation (`src/tests/project-isolation.test.ts`)

| Scenario | Test File | Status | Notes |
|---|---|---|---|
| Project A admin can't see Project B users | `tests/project-isolation.test.ts` | ✅ Covered | Data leak prevention |
| Project A admin can't modify Project B orders | `tests/project-isolation.test.ts` | ✅ Covered | Cross-project mutation |
| Global Admin sees all projects | `tests/project-isolation.test.ts` | ✅ Covered | Positive case |
