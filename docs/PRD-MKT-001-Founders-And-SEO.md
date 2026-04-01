# Product Requirements Document (PRD)
**Document ID:** PRD-MKT-001
**Title:** Smmplan Marketing Growth Engine (Founders Club & Programmatic SEO)
**Status:** Approved for Development
**Date:** March 2026

## 1. Executive Summary
This document outlines the software requirements necessary to support the Smmplan "Guerrilla Marketing" strategy. The objectives are to reduce Customer Acquisition Cost (CAC) through Programmatic SEO (pSEO) and to maximize initial Capitalization and Customer Lifetime Value (LTV) via the "Founders Club 300" Limited Offer module.

## 2. Business Objectives
* **Objective 1:** Capture organic search traffic for low-competition long-tail keywords (e.g., "купить инстаграм лайки алматы").
* **Objective 2:** Incentivize the first 300 B2B users to make a high-ticket initial deposit (≥$100 equivalent) by offering a lifetime wholesale discount.

---

## 3. Epic 1: Founders Club 300 (FOMO Engine)
**Description:** A gamified, limited-capacity tier granting wholesale pricing to early adopters.

### 3.1. User Stories
* **US-1.1:** As a prospect, I want to see a live progress bar on the Homepage and Registration page showing how many slots (out of 300) are left in the Founders Club, so I feel urgency to register.
* **US-1.2:** As a newly registered user, I want to see a banner in my Dashboard prompting me to deposit a minimum threshold (e.g., 10,000 RUB / 100 USD) to lock in my Founder status.
* **US-1.3:** As an Administrator, I want the system to automatically assign the "Founder" role/badge and a 30% discount modifier to a user once they meet the deposit threshold.

### 3.2. Technical Specifications & Data Model Changes
**Database Schema (`schema.prisma`):**
* Ensure `User` or `ProjectMembership` model has a `isFounder` (Boolean, default: false) field, or utilize the existing achievement system to grant a `FOUNDER_BADGE`.
* Introduce a `discountMultiplier` (Float, default: 1.0) on the `Project` or `User` model. For founders, `discountMultiplier = 0.7`.

**Service Layer (`UserService` / `BillingService`):**
* Implement a webhook or listener on successful payment. If `totalDeposits >= THRESHOLD` AND `globalFounderCount < 300`, then `user.isFounder = true`.
* Update the Price Calculation Engine: Output Price = `Base Price * marginMultiplier * user.discountMultiplier`.

### 3.3. Acceptance Criteria (UAT)
1. **Given** 300 users already have the Founder status, **When** the 301st user deposits the threshold amount, **Then** they do not receive the Founder status or discount.
2. **Given** an active Founder, **When** they request pricing via API or UI, **Then** all displayed prices reflect a 30% reduction from the base retail price.

---

## 4. Epic 2: Programmatic SEO (pSEO) Pipeline
**Description:** Dynamic page generation engine to capture long-tail algorithmic search traffic.

### 4.1. User Stories
* **US-2.1:** As an unauthenticated organic user, I want to land on a hyper-specific service page (e.g., `/buy/telegram/subscribers/crypto`) that contains relevant localized H1 tags and FAQs.
* **US-2.2:** As a search engine crawler, I want to easily parse dynamic sitemaps containing all possible service/geo permutations.

### 4.2. Technical Specifications & Architecture
**Next.js App Router Implementation:**
* Route Structure: `src/app/buy/[platform]/[action]/[modifier]/page.tsx`
* Utilizing `generateStaticParams()` to pre-render the top 5,000 most profitable combinations at build time (SSG), while allowing fallback for rarer long-tail queries (ISR).
* Metadata API: Implement `generateMetadata()` to inject dynamic `<title>` and `<meta name="description">` based on the URL parameters.

**Dictionary/Content Matrix:**
* Maintain a JSON dictionary mapping parameters to human-readable strings (e.g., `platform: 'telegram' -> 'Телеграм'`).

### 4.3. Acceptance Criteria (UAT)
1. **Given** the URL `/buy/instagram/likes/cheap`, **When** the page renders, **Then** the H1 tag must exactly be "Купить лайки Инстаграм дешево" and the `<title>` must contain the exact keyword match.
2. **Given** a Google Bot request, **Then** the page must return a 200 OK status code within 50ms (Cache Hit via SSG/ISR) and present fully semantic HTML5 without requiring client-side React hydration.

---

## 5. Epic 3: Promo Balance Engine (Защита от потерь при эмиссии)
**Description:** Система управления промо-балансом (виртуальной валютой), которая минимизирует реальные расходы на провайдеров при раздаче бесплатного баланса блогерам, партнёрам и в рамках крауд-маркетинга.

### 5.1. User Stories
* **US-3.1:** As an Administrator, I want to issue a promotional balance to a user that is **frozen** until the user completes a required action (e.g., posts a video review), so that we never pay provider costs without receiving marketing value.
* **US-3.2:** As a promotional balance holder, I want to see my frozen balance with a clear label ("Заморожено — выполните условие для активации") and the deadline by which I must complete the action.
* **US-3.3:** As a promotional balance holder, I want to spend my unlocked promo-balance **only on high-margin services** (e.g., Telegram Views, Reactions), so the platform controls its cost-to-serve.
* **US-3.4:** As the system, I want to automatically expire (burn) any unused promotional balance after **30 calendar days** from the date of issuance.

### 5.2. Technical Specifications & Data Model Changes
**Database Schema (`schema.prisma`):**
```prisma
model PromoBalance {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  amount          Float                              // Nominal value (e.g., 20000 RUB)
  status          PromoStatus @default(FROZEN)        // FROZEN | ACTIVE | EXPIRED | SPENT
  promoType       PromoType                           // BARTER | CROWD | PARTNER | FOUNDERS
  condition       String                              // e.g., "tiktok_video_review"
  conditionProof  String?                             // URL to proof (video link, screenshot)
  verifiedBy      String?                             // Admin user ID who verified
  allowedServices String[]                            // Whitelist of ServiceCategory slugs
  maxOrderPercent Int         @default(100)           // Default 100% (no co-pay). Override per type.
  issuedAt        DateTime    @default(now())
  expiresAt       DateTime                            // issuedAt + TTL (type-dependent)
  activatedAt     DateTime?
  spentAmount     Float       @default(0)
}

enum PromoStatus {
  FROZEN
  ACTIVE
  EXPIRED
  SPENT
}

enum PromoType {
  BARTER    // Influencer video/content exchange
  CROWD     // Reviews/UGC campaigns
  PARTNER   // Cross-marketing with B2B services
  FOUNDERS  // Founders Club onboarding bonus
}
```

**Preset Profiles by PromoType (Reputation-Safe Defaults):**
| PromoType | Co-Pay (`maxOrderPercent`) | Service Whitelist | TTL | Escrow | Rationale |
|---|---|---|---|---|---|
| `BARTER` | **100%** (без доплаты) | Все услуги кроме YouTube Подписчиков | 30 дней | Заморозка до проверки видео | Блогер уже "заплатил" контентом. Требовать доплату = негатив и антиреклама |
| `CROWD` | **50%** (доплата обязательна) | Только высокомаржинальные (ТГ Просмотры/Реакции) | 30 дней | Заморозка до проверки скриншота отзыва | Массовая акция, высокий риск злоупотреблений |
| `PARTNER` | **100%** (без доплаты) | Все услуги кроме YouTube Подписчиков | 30 дней | Без заморозки (активен сразу по промокоду) | Юзер пришёл от партнёра, трение = потеря лида |
| `FOUNDERS` | **100%** (без доплаты) | Все услуги | 90 дней | Без заморозки | VIP-статус, максимальная лояльность |

**Service Layer (`PromoBalanceService`):**
* `issuePromoBalance(userId, amount, condition, allowedServices[], ttlDays = 30)` — Creates a frozen promo balance with a 30-day TTL.
* `verifyAndActivate(promoId, proofUrl, adminId)` — Admin verifies the condition (video link/screenshot). Sets `status = ACTIVE`, records `activatedAt`.
* `applyToOrder(orderId, promoId)` — Deducts from promo balance. Validates: (a) status === ACTIVE, (b) service is in `allowedServices[]`, (c) promo covers ≤ `maxOrderPercent`% of order total, (d) `expiresAt > now()`.
* **Cron Job (Daily):** Scans for `status = FROZEN | ACTIVE` where `expiresAt < now()`. Sets `status = EXPIRED`. Remaining balance is burned.

**Margin-Aware Service Whitelist (Default):**
| Service Category | Est. Provider Cost | Promo Allowed? |
|---|---|---|
| Telegram Просмотры | ~5% от цены | ✅ Да |
| Telegram Реакции | ~3% от цены | ✅ Да |
| Telegram Подписчики (боты) | ~15% от цены | ✅ Да |
| Instagram Лайки | ~20% от цены | ⚠️ С ограничением |
| YouTube Подписчики | ~60% от цены | ❌ Нет |
| Instagram Подписчики (живые) | ~50% от цены | ❌ Нет |

### 5.3. Reputation Risk Mitigation (Анти-Негатив)
Блогеры, обнаружившие скрытые ограничения после съёмки видео, могут снять разгромный ролик. Репутационный ущерб многократно превысит экономию.

**Правила:**
1. **Прозрачность на этапе оффера:** В скрипте Outreach указывается конкретная категория: *"Даю 20 000 ₽ на Telegram-продвижение"*, а не абстрактный "баланс". Блогер изначально знает, на что пойдут деньги.
2. **Для типа `BARTER` запрещён Co-Pay:** Блогер уже заплатил своим контентом. Требовать ещё деньги = bait-and-switch = антиреклама.
3. **Широкий Whitelist для `BARTER`:** Блокируем только самые дорогие услуги (YouTube Подписчики ~60% себестоимости). Всё остальное — доступно. Блогеру не должно казаться, что его "зажали".
4. **Личный контакт:** Бартерных партнёров ведёт менеджер (или бот с human handoff). Все ограничения объясняются ДО начала работы, а не после.

### 5.4. Acceptance Criteria (UAT)
1. **Given** a user with a FROZEN promo balance, **When** they attempt to place an order using the promo balance, **Then** the system rejects the transaction with error "Промо-баланс заморожен. Выполните условие для активации."
2. **Given** a user with an ACTIVE `CROWD` promo balance of 20,000 ₽ and `maxOrderPercent = 50`, **When** they place an order for 10,000 ₽, **Then** the system allows a maximum promo deduction of 5,000 ₽ and requires 5,000 ₽ from the real balance.
3. **Given** a user with an ACTIVE `BARTER` promo balance of 20,000 ₽ and `maxOrderPercent = 100`, **When** they place an order for 10,000 ₽, **Then** the system allows full 10,000 ₽ promo deduction with no co-pay required.
4. **Given** a promo balance issued 31 days ago with status ACTIVE and remaining amount > 0, **When** the daily cron job runs, **Then** the status is set to EXPIRED and the remaining amount is burned (set to 0).
5. **Given** a user attempts to use promo balance on a service NOT in `allowedServices[]`, **Then** the system rejects the transaction with error "Промо-баланс нельзя использовать для данной услуги."

---

## 6. Security & Isolation Considerations
* The Founders Club discount logic must be applied securely on the Server Actions / Next.js API layer. Client-side state must strictly be visual-only.
* The pSEO dynamic routing must validate `[platform]` and `[action]` parameters against an allowed Enum whitelist to prevent Open Redirects or Path Traversal attacks.
* **Promo Balance:** All promo deduction logic MUST execute server-side. The `allowedServices[]` whitelist and `maxOrderPercent` cap are enforced in `PromoBalanceService.applyToOrder()`, never on the client. Promo balance fields must not be editable by the user via any API endpoint.
