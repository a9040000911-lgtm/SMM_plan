---
name: motion_design_protocol
description: Индустриальный стандарт и протокол создания UI/UX анимаций. Принципы Motion Design, библиотеки (Framer Motion, Tailwind, Aceternity UI), работа с производительностью и "белыми пятнами".
---

# 🪄 Motion Design & Animation Protocol (Smmplan)

Этот навык обязателен к применению при проектировании, разработке или рефакторинге любых анимированных элементов интерфейса. Протокол учитывает стек: React 19+, Next.js 16+, Tailwind CSS 4+, Framer Motion.

> **Ключевой принцип архитектуры**: Все анимации в проекте разделены на два независимых домена — **Текст** и **Элементы**. У каждого домена собственная методология, собственные атомы и собственные правила разнообразия.

> **📁 Код и примеры** вынесены в папку `examples/` для компактности:
> - `examples/text-atoms.md` — Т1–Т8 (текстовые шаблоны с кодом)
> - `examples/element-atoms.md` — Э1–Э7 + Spring Presets (элементные шаблоны)
> - `examples/good-vs-bad.md` — 10 пар ✅/❌ примеров (антипаттерны с объяснениями)
> - `examples/usage-scenarios.md` — 6 сценариев применения + матрица атомов

---

## 0. 📚 Научная база и источники (Science & References)

Все правила основаны на рецензированных исследованиях и индустриальных гайдлайнах.

### 0.1 Когнитивная психология восприятия времени

| Порог | Время | Восприятие пользователем | Источник |
|-------|-------|-------------------------|----------|
| **Мгновенность** | < 100ms | Действие воспринимается как **мгновенное** | Nielsen, 1993; NNGroup |
| **Непрерывность** | 100–300ms | Пользователь ощущает **связь** между действием и результатом | NNGroup; Card et al., 1983 |
| **Порог ожидания** | > 500ms | Интерфейс воспринимается как **медленный** | Miller, 1968; NNGroup |

**Вывод для Smmplan:** Любая интерактивная анимация ОБЯЗАНА уложиться в 100–300ms. Если не укладывается — это баг.

### 0.2 12 Принципов Диснея → UI/UX маппинг

| Принцип Диснея | Интерпретация в UI/UX | Наш атом |
|---------------|----------------------|---------|
| **Squash & Stretch** | Сжимаемость кнопки при нажатии (scaleX/scaleY) | Э5 |
| **Anticipation** | Лёгкий подъём карточки при ховере | Э2 |
| **Staging** | Затемнение фона за модалкой, stagger-каскад | Э3, Э1 |
| **Slow In / Slow Out** | `ease-out` вместо `linear` | §1.2 |
| **Follow Through** | Каскадное `staggerChildren` | Э1 |
| **Secondary Action** | Тень/glow при подъёме карточки | Э2 |
| **Timing** | 100ms–500ms, зависит от массы | §1.1 |
| **Exaggeration** | ОСТОРОЖНО. Только Hero / геймификация | §2: Intensity 4 |
| **Solid Drawing** | Глубина через perspective, z-axis | Т6 |
| **Appeal** | Spring вместо Linear | Presets |

### 0.3 Google Material Design 3 — Motion System

> *"Spring-based motion adapts to velocity and interruption, creating responsive interfaces that feel alive."* — material.io

- **Informative:** `layoutId` показывает: "это тот же объект, просто развернулся".
- **Focused:** Staging через stagger и dimming.
- **Expressive:** Smmplan = **professional + snappy** (не мультяшный, не вязкий).

### 0.4 Apple HIG — Motion (3 принципа)

1. Анимация — не единственный канал коммуникации (A11y).
2. Уважай `Reduce Motion`. Обязательно деградировать.
3. Краткость: системные анимации iOS = 100–350ms.

### 0.5 Индустриальные примеры (Best-in-class SaaS)

| Компания | Техника | Наш атом |
|---------|---------|---------|
| **Stripe** | Scrollytelling, кастомные bezier | Э4, TWEEN.cinematic |
| **Vercel** | Fade-up, gradient-shimmer, glow | Т5, Э2 |
| **Linear** | < 200ms всё, spring | SPRING.snappy, TWEEN.quick |
| **Apple** | Word-by-word reveal с blur, 3D-параллакс | Т2, Т8 |
| **Notion** | Мягкие spring sidebar, layout morphing | SPRING.gentle, layoutId |

---

## 1. 📐 Фундаментальные правила (общие для обоих доменов)

### 1.1 Timing (научно обоснованный)
| Категория | Длительность | Обоснование | Пример |
|-----------|-------------|------------|---------|
| Микро (Hover, Click, Toggle) | `100ms – 200ms` | < порога мгновенности | Ховер кнопки |
| Структурные (Modal, Drawer) | `200ms – 350ms` | Зона "непрерывности" | Открытие модалки |
| Презентационные (Hero) | `400ms – 1200ms` | Однократный показ | Hero-заголовок |
| Фоновые (Aurora, Shimmer) | `2s – 8s` (loop) | Периферийное зрение | Градиент |

### 1.2 Easing
- **Вход:** `ease-out` / `[0.16, 1, 0.3, 1]` *(Принцип Диснея: Slow In/Slow Out)*
- **Выход:** `ease-in` / `[0.4, 0, 1, 1]`
- **Интерактив:** `type: "spring"` *(M3 Expressive)*
- **ЗАПРЕЩЕНО:** `linear` для UI-элементов

### 1.3 GPU-безопасность
**Только:** `transform`, `opacity`, `filter` (blur).
**ЗАПРЕЩЕНО:** `width`, `height`, `margin`, `padding`, `top`, `left` → Reflow.

### 1.4 Accessibility (A11y)
Обязательна деградация при `prefers-reduced-motion: reduce` (Apple HIG). Все шаблоны оборачиваются в `useReducedMotion()`.

### 1.5 Next.js App Router
Все компоненты с Framer Motion → `"use client"` + отдельные файлы (изоляция от RSC).

---

## 2. 🎭 Методология разнообразия (Anti-Monotony System)

> **Проблема:** если каждый элемент делает одно и то же `opacity: 0 → 1, y: 20 → 0`, интерфейс "сливается".

Система **Motion Vocabulary** — 4 оси варьирования. Каждая секция страницы комбинирует **минимум 2 оси из 4**:

### Ось 1: Направление (Direction)
| Код | Направление | Когда |
|-----|------------|-------|
| `y: 20 → 0` | ↑ Снизу вверх | Основной контент |
| `y: -20 → 0` | ↓ Сверху вниз | Dropdown, тосты |
| `x: -30 → 0` | → Слева | Sidebar, навигация |
| `x: 30 → 0` | ← Справа | Drawer, детали |
| `scale: 0.9 → 1` | Из центра | Модалки, поповеры |
| `z: -500 → 0` | Из глубины | Hero, wow-секции |

### Ось 2: Персонаж (Motion Character)
| Персонаж | Конфиг | Применение |
|----------|--------|-----------|
| **Snappy** | spring 400/15 | Кнопки, тосты |
| **Smooth** | tween 0.3s ease-out | Fade-in, scroll reveal |
| **Heavy** | spring 150/10/2.5 | Падение, ошибки |
| **Cinematic** | tween 1.2s [0.16,1,0.3,1] | Hero-заголовки |
| **Elastic** | spring 500/8 | Геймификация |

### Ось 3: Оркестровка (Orchestration)
| Паттерн | Описание | API |
|---------|----------|----|
| **Solo** | Один элемент | `initial` + `animate` |
| **Stagger** | Каскад | `staggerChildren: 0.05` |
| **Choreography** | Разные направления | Разные `variants` |
| **Scroll-linked** | Привязка к скроллу | `useScroll` + `useTransform` |

### Ось 4: Интенсивность (Intensity)
| Уровень | Смещение | Blur | Scale | Применение |
|---------|---------|------|-------|-----------|
| **Subtle** (1) | y: 8 | 0 | 0.98 | Мелкий текст |
| **Medium** (2) | y: 20 | 0 | 0.95 | Основной контент |
| **Dramatic** (3) | y: 40 | 5px | 0.85 | Hero-блоки |
| **Cinematic** (4) | y: 80 / z: -1000 | 20px | 0.2 | Wow-моменты |

### 🧮 Формула "Анти-монотонности"
**Каждая следующая секция отличается минимум по 2 осям от предыдущей.**

```
Секция 1 (Hero):   Из глубины  + Cinematic  + Solo
Секция 2 (Фичи):   Снизу вверх + Smooth     + Stagger
Секция 3 (Тарифы): Из центра   + Snappy     + Choreography
Секция 4 (Отзывы): Слева       + Smooth     + Scroll-linked
```

---

## 3. 🔤 ДОМЕН А: Анимация Текста (Typography Motion)

### 3A.1 Уровни детализации

| Уровень | Единица | Сложность | Производительность |
|---------|---------|-----------|-------------------|
| **Block** | Абзац целиком | Низкая | Отличная |
| **Word** | Каждое слово | Высокая | Средняя |
| **Character** | Каждая буква | Очень высокая | Осторожно |

**Правило:** Character — только для Hero (≤30 символов). Body text — только Block.

### 3A.2 Каталог текстовых атомов

> 📁 **Полный код** → `examples/text-atoms.md`

| Атом | Название | Назначение | Уровень |
|------|---------|-----------|---------|
| **Т1** | Block Fade-up | Базовый вход текста снизу | Block |
| **Т2** | Word-by-Word Reveal | Стиль Apple / Stripe | Word |
| **Т3** | Character Stagger | Побуквенный каскад | Character |
| **Т4** | Typewriter | Печатная машинка (AI/Chat) | Character |
| **Т5** | Gradient Shimmer | Переливающийся градиент (CSS) | Block |
| **Т6** | 3D Fly-in | Кинематографический полёт | Block |
| **Т7** | Variable Font Shared Letter | Деформация буквы через VF Axes | Character |
| **Т8** | Scroll-driven Word Reveal | Проявление при скролле (apple.com) | Word |

### 3A.3 Decision Tree (выбор текстовой анимации)

```
Это body text / параграф?
  → ДА → Т1 (Block Fade-up)
  → НЕТ ↓

Это h1 на Hero-секции?
  → ДА → Выбор по стилю:
         • Минималистичный / Apple     → Т2 (Word-by-Word)
         • Геймерский / Wow            → Т3 или Т6 (3D Fly-in)
         • AI/Chat                     → Т4 (Typewriter)
         • Премиальный / SaaS          → Т5 (Shimmer) + Т1
         • Брендинг / "игра буквой"    → Т7 (Variable Font)
         • Длинный текст + скролл      → Т8 (Scroll Reveal)
  → НЕТ ↓

Это h2-h3 внутри секции?
  → Т1 с `whileInView`

Длинный объясняющий текст при скролле?
  → Т8 (Scroll-driven Word Reveal)
```

---

## 4. 🧊 ДОМЕН Б: Анимация Элементов (Component Motion)

### 4B.1 Каталог элементных атомов

> 📁 **Полный код + Spring Presets** → `examples/element-atoms.md`

| Атом | Название | Назначение |
|------|---------|-----------|
| **Э1** | Staggered List | Каскад элементов списка |
| **Э2** | Spotlight Card | Голографическое свечение при ховере |
| **Э3** | Animated Modal | Модалка с exit + backdrop blur |
| **Э4** | Scroll Reveal | Обёртка для появления при скролле |
| **Э5** | Button State Machine | idle → loading → success → error |
| **Э6** | Skeleton Shimmer | CSS-only мерцающий загрузчик (RSC) |
| **Э7** | Toast Notification | Всплывающее уведомление |

### 4B.2 Decision Tree (выбор элементной анимации)

```
Какова роль элемента?

├─ СТРУКТУРНЫЙ (Modal, Drawer, Page)
│   → Э3 + Snappy + Из центра
│
├─ КОНТЕЙНЕР ДАННЫХ (Список, Grid)
│   → Э1 (Stagger) + Э6 (Skeleton) пока загрузка
│
├─ ИНТЕРАКТИВНЫЙ (Кнопка, Card)
│   → Кнопка с формой → Э5 (State Machine)
│   → Карточка        → Э2 (Spotlight)
│
├─ УВЕДОМЛЕНИЕ (Toast, Badge)
│   → Э7 + Снизу + Snappy
│
├─ КОНТЕНТ ПРИ СКРОЛЛЕ (Лендинг)
│   → Э4 + чередовать Direction (Anti-Monotony)
│
└─ ФОНОВЫЙ ЭФФЕКТ (Aurora, Particles)
    → CSS-only. Отключать на мобилках.
```

---

## 5. 🕳 Белые пятна и Риски

1. **Hydration Mismatch:** → `"use client"` + `useIsMounted`.
2. **Mobile Performance:** → `useAdaptiveMotion()` хук, деградация до fade-in.
3. **Scroll-linked Jank:** → CSS Scroll-driven Animations (новый API).
4. **Character DOM-bloat:** → макс. 30 символов для `CharStagger`.
5. **Route Transitions:** → `AnimatePresence` в layout.tsx.

---

## 6. 📝 Чек-лист ревьюера (к каждому PR с анимацией)

| # | Вопрос | Если НЕТ |
|---|--------|----------|
| 1 | Только GPU-свойства? | Переделать на `transform`/`opacity` |
| 2 | ≤ 300ms для интерактива? | Ускорить |
| 3 | `motion-reduce` деградация? | Добавить `useReducedMotion` |
| 4 | `"use client"` помечен? | Пометить, вынести |
| 5 | Не фризит на мобилке? | Упростить до fade-in |
| 6 | ≥2 оси отличия от соседней секции? | Изменить направление/персонаж |
| 7 | Design Integration Check пройден? | Проверить §7 |

---

## 7. 🎨 Design Integration Protocol

> Анимация — часть дизайн-системы, а не слой поверх неё.

### 7.1 Уникализируемые параметры (18 штук)

**A. Motion:** Direction, Distance, Duration, Delay, Easing, Stiffness, Damping, Mass
**B. Transform:** Scale, Rotation, Skew, Transform Origin
**C. Filters:** Opacity, Blur, Brightness, Saturate
**D. Orchestration:** Stagger Delay, Stagger Order

### 7.2 Пять контрольных точек интеграции

#### ✅ Check 1: Контрастность
| Контекст фона | Безопасно | Опасно |
|---------------|----------|--------|
| Тёмный | Glow, Beam, Spotlight | Тёмные тени |
| Светлый | Тени, Skeleton-shimmer | Glow (теряется) |
| Градиент | Fade (opacity only) | Blur (смазывает) |

#### ✅ Check 2: Типографика
| Шрифт | Интенсивность | Комментарий |
|-------|-------------|-------------|
| Bold ≥32px | Dramatic | "Держит" сильное движение |
| Medium 18-24px | Medium | y: 20px стандарт |
| Regular 14-16px | Subtle | y: 8px, без blur |
| Light ≤300 | None | Только opacity |

#### ✅ Check 3: Grid
Сдвиги кратны 4px: `8, 12, 16, 20, 24, 32`. Запрещено: `17, 23, 37`.

#### ✅ Check 4: Палитра
Анимация НЕ вводит новые цвета. Только `primary`, `destructive`, `success`, `muted` с разной alpha.

#### ✅ Check 5: Иерархия
| Элемент | Допустимо | Запрещено |
|---------|----------|----------|
| Primary CTA | Squash при клике | Постоянная loop-анимация |
| Hero Title | Cinematic 1 раз | Бесконечный loop |
| Card | Subtle hover (1.02) | Dramatic hover (1.1 + blur) |
| Фон | Slow loop (6s+) | Fast loop (< 2s) |
| Навигация | Quick (150ms) | Cinematic (> 500ms) |

**Правило иерархии:** Интенсивность обратно пропорциональна частоте взаимодействия.

### 7.3 Карточка интеграции
```
// MOTION INTEGRATION CARD
// Background:      dark (slate-900)        → Glow OK
// Font weight:     700, 48px               → Dramatic OK
// Grid unit:       4px                     → Distance: 24px ✓
// Palette colors:  sky-400                 → From DS ✓
// Visual priority: Primary (Hero h1)       → Cinematic ✓
// Reduced motion:  opacity-only fallback   ✓
```

---

## 8. 🔭 Gap Analysis: чего не хватает (2025–2026)

| # | Техника | Статус | Приоритет |
|---|---------|--------|----------|
| 8.1 | **Magnetic Buttons** — притягиваются к курсору | ❌ | 🔴 Высокий |
| 8.2 | **Context-Aware Cursor** — меняет форму по зоне | ❌ | 🟡 Средний |
| 8.3 | **Clip-Path Reveals** — маски вместо fade | ❌ | 🟡 Средний |
| 8.4 | **Kinetic Typography** — scroll-driven word reveal | ✅ Т7+Т8 | ✅ Закрыт |
| 8.5 | **Adaptive Motion** — хук `useAdaptiveMotion()` | ⚠️ Нет кода | 🔴 Высокий |
| 8.6 | **Стоп-лист** (The Movie Rule) | ✅ | ✅ Закрыт |

### Стоп-лист: где НЕ анимировать

| Элемент | Почему | Исключение |
|---------|--------|-----------|
| Body text (параграфы) | Читать, а не смотреть | Hero 1-й абзац — fade ОК |
| Breadcrumbs | Ориентир | Нет |
| Таблицы с данными | Стабильность цифр | Skeleton при загрузке ОК |
| Формы ввода | Отвлекает от набора | Focus-ring ОК |
| Пагинация | Частое взаимодействие | Нет |
| Error messages | Стресс пользователя | Shake кнопки ОК |

---

## 9. 📖 Руководство пользователя (через диалог)

### 9.1 Когда скилл активируется автоматически

AI-агент **сам** обращается к этому скиллу, когда в запросе есть:
- Создание/изменение UI-компонента
- Слова: "анимация", "motion", "плавно", "эффект", "переход", "hover", "появление"
- Задача: лендинг, Hero-секция, маркетинговая страница, дашборд

Внутренний порядок агента: Decision Tree (§3A.3 / §4B.2) → Design Integration Check (§7) → PR Checklist (§6).

### 9.2 Как пользоваться: живые диалоги

Ниже — реальные сценарии общения с AI. Вам **не нужно** знать названия атомов или технических терминов. Просто опишите что хотите обычными словами.

---

#### 💬 Диалог 1: Новичок — "Просто сделай красиво"

> **Вы:** Сделай страницу тарифов красивой, добавь анимацию

> **AI (мыслит):**
> - Контекст: страница тарифов = каталог + CTA
> - Сценарий: E-commerce (→ `examples/usage-scenarios.md`)
> - Decision Tree §4B.2: Контейнер данных → Э1 (Stagger) + Э6 (Skeleton)
> - Карточки → Э2 (Spotlight hover)
> - Кнопка "Купить" → Э5 (State Machine)
> - Integration Check §7: фон тёмный? → glow ОК. Шрифт bold 24px? → Medium intensity.

> **AI (отвечает):** Добавил анимацию на тарифы:
> - Карточки появляются каскадом снизу (Э1, stagger 50ms)
> - При наведении — голографическое свечение (Э2)
> - Кнопка "Купить" показывает состояния: клик → загрузка → успех (Э5)
> - Пока данные грузятся — skeleton-шиммер (Э6)

**Что произошло:** Вы сказали 8 слов. AI применил 4 атома, прошёл все проверки.

---

#### 💬 Диалог 2: "Хочу как у Apple"

> **Вы:** Сделай заголовок на главной как у Apple — чтобы слова появлялись по одному

> **AI (мыслит):**
> - "как у Apple" + "слова по одному" → Словарь: Т2 (Word-by-Word Reveal)
> - Hero h1 → Decision Tree §3A.3 → Минималистичный/Apple → Т2 ✓
> - Check §7.2: шрифт Inter Bold 48px → Dramatic intensity допустима

> **AI:** Применил Word-by-Word Reveal (Т2) на заголовок:
> ```tsx
> <WordReveal text="Автоматизируйте ваш SMM за минуты" className="text-5xl font-bold" />
> ```
> Каждое слово проявляется с blur→clear, задержка 40ms между словами.

---

#### 💬 Диалог 3: "Не нравится, переделай"

> **Вы:** Слишком скучно. Хочу чтобы было мощнее, как в кино

> **AI (мыслит):**
> - "мощнее" + "как в кино" → Словарь: Т6 (3D Fly-in) + Cinematic easing
> - Upgrade: Т2 → Т6. Проверяю допустимость: Hero h1, однократный показ → Cinematic ОК
> - Добавлю blur 15px → 0px для глубины резкости
> - Check §7.2: Bold 48px → Dramatic/Cinematic ОК ✓

> **AI:** Переделал на кинематографический вход (Т6):
> Заголовок вылетает из глубины экрана с размытием, как в трейлере фильма.
> Длительность 1.2s, easing [0.16, 1, 0.3, 1].

---

#### 💬 Диалог 4: "Кнопка должна показывать что происходит"

> **Вы:** Когда нажимаю "Оплатить" — хочу видеть что идёт загрузка, потом галочку если ОК

> **AI (мыслит):**
> - "загрузка → галочка" → Словарь: Э5 (Button State Machine)
> - Контекст: платёжная форма → Э5 критически важен
> - States: idle ("Оплатить") → loading (спиннер) → success (✓) → error (тряска + ✗)
> - Check §7.2: кнопка = частое взаимодействие → Quick intensity, spring

> **AI:** Внедрил StatefulButton (Э5) в форму оплаты:
> - **idle:** "Оплатить" — при нажатии лёгкое сжатие (scaleY: 0.95)
> - **loading:** спиннер ⏳, кнопка заблокирована
> - **success:** зелёная галочка ✓, текст плавно сменяется
> - **error:** красный ✗ + тряска кнопки (x: ±6px)

---

#### 💬 Диалог 5: "Модалка тормозит — почини"

> **Вы:** Модальное окно открывается слишком медленно, раздражает

> **AI (мыслит):**
> - Проблема: анимация > 500ms → нарушение §1.1 (NNGroup: > 500ms = "медленно")
> - Модалка = структурный элемент → допустимо 200–350ms максимум
> - Текущее: скорее всего tween 800ms или ease-in-out 1s
> - Решение: SPRING.snappy (≈250ms с пружинным характером)
> - Антипаттерн #4 из `good-vs-bad.md`: "Слишком медленные переходы"

> **AI:** Ускорил модалку:
> - **Было:** `transition: { duration: 0.8 }` (800ms)
> - **Стало:** `transition: SPRING.snappy` (≈250ms, spring)
> - Также добавил backdrop-blur на фон для ощущения глубины

---

#### 💬 Диалог 6: Продвинутый — "Лендинг из 4 секций, всё должно быть разным"

> **Вы:** Делаю лендинг. Hero, блок фичей, тарифы, отзывы. Хочу чтобы анимации не повторялись

> **AI (мыслит):**
> - "не повторялись" → §2 Anti-Monotony System
> - 4 секции → проверяю: каждая отличается по ≥2 осям из 4
> - Формирую раскладку:

> **AI:** Раскладка по Anti-Monotony System:
>
> | Секция | Направление | Персонаж | Оркестровка | Атомы |
> |--------|------------|----------|-------------|-------|
> | Hero | z-axis (из глубины) | Cinematic | Solo | Т6 + Т5(shimmer) |
> | Фичи | ↑ снизу вверх | Smooth | Stagger | Э4 → Э1 |
> | Тарифы | center (из центра) | Snappy | Choreography | Э2 + Э5 |
> | Отзывы | ← слева | Smooth | Scroll-linked | Э4 + Т8 |
>
> Каждая секция отличается минимум по 3 осям от предыдущей. ✓

---

#### 💬 Диалог 7: Эксперт — прямые указания

> **Вы:** На Hero: CharStagger с spring heavy, intensity Dramatic. Фичи: stagger 80ms, direction left, smooth. And make sure the VF shared letter on "SMMPLAN" breathes in the footer.

> **AI (мыслит):**
> - Пользователь говорит терминами протокола → применяю буквально:
>   - Hero h1: Т3 (CharStagger) + SPRING.heavy + Intensity 3 (y: 40, blur: 5px)
>   - Фичи: Э1 (staggerChildren: 0.08) + direction: left (x: -30) + TWEEN.smooth
>   - Footer logo: Т7 (SharedLetter) CSS-вариант, `letter-breathe` keyframe
> - Check §7: heavy spring на Hero h1 bold 48px → ОК. VF в footer → медленный loop 3s → ОК.

> **AI:** Применил точно по спецификации. 3 компонента созданы:
> - `HeroTitle.tsx` — CharStagger + heavy spring
> - `FeaturesList.tsx` — stagger 80ms, slide from left
> - Footer logo — CSS `@keyframes letter-breathe` на букве M в "SMMPLAN"

---

### 9.3 Шпаргалка: ваши слова → что AI сделает

Вам **не нужно** запоминать коды. Просто говорите естественно:

| Вы говорите | AI понимает как | Результат |
|------------|----------------|----------|
| "сделай плавно" | Smooth + fade | Мягкое появление снизу |
| "с отскоком" / "bounce" | Spring snappy | Упругий прыжок |
| "тяжело" / "грузно" | Spring heavy | Весомое падение |
| "как в кино" | 3D + blur + cinematic | Полёт из-за камеры |
| "как у Apple" / "слово за словом" | Word-by-Word | Слова появляются по очереди |
| "печатающийся" / "как ChatGPT" | Typewriter | Буквы печатаются с курсором |
| "переливается" / "блестит" | Gradient shimmer | Блик бежит по тексту |
| "буква за буквой" | Char stagger | Каскад букв |
| "каскадом" / "по одному" | Stagger list | Элементы друг за другом |
| "светится" / "голограмма" | Spotlight card | Свечение за курсором |
| "модалка плавно" | Spring modal | Быстрое мягкое открытие |
| "при скролле" | Scroll reveal | Появляется при прокрутке |
| "загрузка → галочка" | Button states | 4 состояния кнопки |
| "скелетон" / "загрузка мерцает" | Skeleton CSS | Мерцающая заглушка |
| "уведомление" / "тост" | Toast | Снизу-справа, auto-dismiss |
| "игра буквой" / "дышит" | Variable Font | Буква меняет толщину |
| "текст при скролле как Apple" | Scroll word reveal | Слова проявляются при чтении |
| "всё одинаковое, скучно" | Anti-Monotony §2 | Разнообразие по 4 осям |
| "не сломай дизайн" | Integration §7 | 5-точечная проверка |
| "тормозит" / "фризит" | Performance fix | GPU-only + memo + spring |
| "на мобилке плохо" | Adaptive motion | Упрощение до fade-in |

### 9.4 Чего НЕ нужно делать

| ❌ Не нужно | ✅ Вместо этого |
|------------|----------------|
| Искать код шаблонов самостоятельно | Просто скажите что хотите — AI найдёт в `examples/` |
| Запоминать Т1, Э5, SPRING.snappy | Говорите обычными словами: "с отскоком", "плавно" |
| Указывать технические параметры | AI подберёт по Decision Tree автоматически |
| Проверять A11y и GPU вручную | AI проверит по чеклисту §6 автоматически |
| Переживать о монотонности | AI применит Anti-Monotony §2 при ≥2 секциях |

---

## Appendix: Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│            MOTION DESIGN QUICK REFERENCE            │
├──────────┬──────────────────────────────────────────┤
│ ТЕКСТ    │ Т1=FadeUp  Т2=WordReveal  Т3=CharStag   │
│          │ Т4=Typewriter  Т5=Shimmer  Т6=3DFlyIn    │
│          │ Т7=SharedLetter  Т8=ScrollReveal          │
├──────────┼──────────────────────────────────────────┤
│ ЭЛЕМЕНТЫ │ Э1=StaggerList  Э2=SpotlightCard         │
│          │ Э3=Modal  Э4=ScrollReveal  Э5=BtnState   │
│          │ Э6=Skeleton  Э7=Toast                     │
├──────────┼──────────────────────────────────────────┤
│ SPRING   │ snappy=400/15  smooth=200/25              │
│ PRESETS  │ heavy=150/10/2.5  elastic=500/8           │
│          │ gentle=120/20/1.2                          │
├──────────┼──────────────────────────────────────────┤
│ TIMING   │ Micro<200ms  Structure<350ms              │
│          │ Hero<1200ms  Background 2-8s loop          │
├──────────┼──────────────────────────────────────────┤
│ RULES    │ GPU only (transform+opacity+filter)        │
│          │ Grid-aligned distances (multiples of 4px)  │
│          │ Anti-Monotony: ≥2 axes different/section   │
│          │ Palette colors only. No new colors.         │
│          │ prefers-reduced-motion: MANDATORY            │
├──────────┼──────────────────────────────────────────┤
│ CODE     │ examples/text-atoms.md                     │
│          │ examples/element-atoms.md                   │
└──────────┴──────────────────────────────────────────┘
```
