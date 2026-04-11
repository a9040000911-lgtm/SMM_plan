# Сценарии применения (Usage Scenarios)

Практические сценарии: какой атом/шаблон выбрать для конкретных бизнес-задач Smmplan.

---

## Сценарий 1: Лендинг / Marketing Page

**Задача:** Продать продукт. Максимум wow, минимум отвлечения от CTA.

```
┌─────────────────────────────────────────┐
│ Hero Section                            │
│   H1: Т6 (3D Fly-in) или Т2 (Word)     │
│   Subtitle: Т1 (Fade-up, delay: 0.3)   │
│   CTA Button: Э5 (State Machine)        │
│   Background: CSS Aurora (loop 6s)      │
├─────────────────────────────────────────┤
│ Features (3 карточки)                   │
│   Container: Э1 (Stagger, direction=up) │
│   Cards: Э2 (Spotlight hover)           │
├─────────────────────────────────────────┤
│ Social Proof / Отзывы                   │
│   Container: Э4 (Scroll Reveal, ←)      │
│   Text: Т8 (Scroll-driven Word Reveal)  │
├─────────────────────────────────────────┤
│ Pricing                                 │
│   Cards: Э1 (Stagger, Snappy)           │
│   Price: Т7 (Variable Font emphasis)    │
│   CTA: Э5 (State Machine)              │
├─────────────────────────────────────────┤
│ Footer                                  │
│   Logo: Т7 (VF breathing, slow loop)   │
│   Static — NO animation                │
└─────────────────────────────────────────┘
```

**Anti-Monotony проверка:**
- Hero: z-axis + Cinematic + Solo ✓
- Features: ↑ + Smooth + Stagger ✓ (3 оси отличия)
- Social Proof: ← + Smooth + Scroll-linked ✓ (2 оси отличия)
- Pricing: center + Snappy + Stagger ✓ (2 оси отличия)

---

## Сценарий 2: Admin Panel / Dashboard

**Задача:** Эффективность. Анимации минимальны и функциональны.

```
┌─────────────────────────────────────────┐
│ Sidebar Navigation                      │
│   Hover: CSS transition 150ms           │
│   Active: border-left + opacity          │
│   ❌ НЕ ДЕЛАТЬ: Stagger, bounce, glow  │
├─────────────────────────────────────────┤
│ Data Table                              │
│   Initial load: Э6 (Skeleton Shimmer)   │
│   Row update: layout animation 200ms    │
│   ❌ НЕ ДЕЛАТЬ: Stagger при каждом     │
│      переключении страницы пагинации   │
├─────────────────────────────────────────┤
│ Modals (Create/Edit)                    │
│   Open/Close: Э3 (Modal, Snappy)        │
│   Form submit: Э5 (Button State)        │
├─────────────────────────────────────────┤
│ Notifications                           │
│   Toast: Э7 (snappy, auto-dismiss 5s)   │
│   Badge counter: SPRING.gentle (scale)  │
├─────────────────────────────────────────┤
│ Charts / Graphs                         │
│   Initial render: Tween 600ms ease-out  │
│   Update: Tween 300ms                   │
│   ❌ НЕ ДЕЛАТЬ: spring (дрожит)        │
└─────────────────────────────────────────┘
```

**Правило для Admin:** Интенсивность = Subtle (1) или Medium (2). НИКОГДА Dramatic/Cinematic.

---

## Сценарий 3: E-commerce / Каталог услуг

**Задача:** Быстрый просмотр, доверие, конверсия.

```
┌─────────────────────────────────────────┐
│ Catalog Grid                            │
│   Initial load: Э6 (Skeleton)           │
│   Items appear: Э1 (Stagger, y: 12)     │
│   ❌ НЕ ДЕЛАТЬ: Stagger при каждом     │
│      scroll (только once: true)         │
├─────────────────────────────────────────┤
│ Product Card Hover                      │
│   Scale: 1.02 + shadow-lift             │
│   Duration: 150ms ease-out              │
│   ❌ НЕ ДЕЛАТЬ: scale > 1.05           │
│   ❌ НЕ ДЕЛАТЬ: blur на соседних       │
├─────────────────────────────────────────┤
│ Cart / Корзина                          │
│   Add item: Toast Э7 + badge bounce     │
│   Remove: exit с x: -20, opacity: 0     │
│   Checkout button: Э5 (State Machine)   │
├─────────────────────────────────────────┤
│ Filters                                 │
│   Open/Close: height → CSS max-height   │
│   ❌ НЕ ДЕЛАТЬ: Framer height animate  │
│   Tags appear: Stagger 0.02s            │
└─────────────────────────────────────────┘
```

---

## Сценарий 4: Onboarding / Welcome Flow

**Задача:** Провести пользователя через шаги, не потерять его.

```
┌─────────────────────────────────────────┐
│ Step Indicator                          │
│   Active dot: SPRING.snappy (scale)     │
│   Progress bar: Tween 300ms width       │
│   ❌ НЕ ДЕЛАТЬ: пульсирующие точки    │
├─────────────────────────────────────────┤
│ Step Content                            │
│   Enter: Fade + x: 30 (→ direction)    │
│   Exit: Fade + x: -30 (← direction)    │
│   Text: Т2 (Word Reveal) на заголовке  │
│   ❌ НЕ ДЕЛАТЬ: 3D Fly-in (слишком)   │
├─────────────────────────────────────────┤
│ CTA / Next Step                         │
│   Button: Э5 (idle → loading → next)    │
│   Появление: delay 0.3s после контента │
└─────────────────────────────────────────┘
```

---

## Сценарий 5: Telegram Bot Web App

**Задача:** Экстремальная производительность. Мобилки, слабые CPU.

```
┌─────────────────────────────────────────┐
│ ДОПУСТИМО                               │
│   Fade-in контента: Т1 (300ms)          │
│   Skeleton при загрузке: Э6 (CSS-only!) │
│   Button states: CSS transition only    │
│   Toast: CSS transform + opacity         │
├─────────────────────────────────────────┤
│ ЗАПРЕЩЕНО                               │
│   ❌ Framer Motion (тяжёлый бандл)      │
│   ❌ Spring-анимации (CPU-intensive)    │
│   ❌ Stagger > 5 элементов              │
│   ❌ Scroll-linked (jank на мобилках)   │
│   ❌ Variable Font axes (не все шрифты) │
│   ❌ Spotlight/Glow (GPU на мобилках)   │
├─────────────────────────────────────────┤
│ СТРАТЕГИЯ                               │
│   • CSS transitions only (no JS lib)    │
│   • max-duration: 200ms                  │
│   • prefers-reduced-motion → instant     │
│   • Skeleton = чистый CSS               │
└─────────────────────────────────────────┘
```

---

## Сценарий 6: Email / Newsletter Template (HTML)

**Задача:** Нулевая анимация. Email-клиенты не поддерживают JS и большинство CSS-анимаций.

```
┌─────────────────────────────────────────┐
│ ДОПУСТИМО                               │
│   ✅ GIF-анимации (в <img>)             │
│   ✅ Progressive enhancement hover      │
│      (Gmail desktop поддерживает)       │
├─────────────────────────────────────────┤
│ ЗАПРЕЩЕНО                               │
│   ❌ CSS @keyframes (Outlook strip)     │
│   ❌ JavaScript (полный запрет)         │
│   ❌ SVG animation (partial support)    │
└─────────────────────────────────────────┘
```

---

## Матрица: Сценарий → Допустимые атомы

| Атом | Лендинг | Admin | Каталог | Onboarding | Tg Bot | Email |
|------|---------|-------|---------|------------|--------|-------|
| Т1 FadeUp | ✅ | ✅ | ✅ | ✅ | ✅ CSS | ❌ |
| Т2 WordReveal | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Т3 CharStagger | ✅ Hero | ❌ | ❌ | ❌ | ❌ | ❌ |
| Т4 Typewriter | ✅ AI | ❌ | ❌ | ✅ | ❌ | ❌ |
| Т5 Shimmer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Т6 3D Fly-in | ✅ Hero | ❌ | ❌ | ❌ | ❌ | ❌ |
| Т7 VF Letter | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Т8 ScrollReveal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Э1 StaggerList | ✅ | ⚠️ 1 раз | ✅ once | ❌ | ❌ | ❌ |
| Э2 Spotlight | ✅ | ❌ | ✅ subtle | ❌ | ❌ | ❌ |
| Э3 Modal | ✅ | ✅ | ✅ | ✅ | CSS | ❌ |
| Э4 ScrollReveal | ✅ | ❌ | ✅ once | ❌ | ❌ | ❌ |
| Э5 BtnState | ✅ | ✅ | ✅ | ✅ | CSS | ❌ |
| Э6 Skeleton | ✅ | ✅ | ✅ | ❌ | ✅ CSS | ❌ |
| Э7 Toast | ✅ | ✅ | ✅ | ❌ | CSS | ❌ |
