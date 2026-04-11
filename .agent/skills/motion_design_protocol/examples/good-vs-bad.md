# ✅ Хорошие vs ❌ Плохие примеры анимации

Этот файл — обязательный справочник антипаттернов. AI-агент обязан проверять
каждую создаваемую анимацию по этим примерам перед коммитом.

---

## 1. 🔴 Reflow-анимация (Layout Thrash)

Самая частая и разрушительная ошибка. Вызывает фриз, jank и CLS.

### ❌ ПЛОХО: Анимация width/height

```tsx
// АНТИПАТТЕРН — вызывает Reflow на КАЖДОМ кадре (60 раз/сек)
<motion.div
  initial={{ width: 0, height: 0 }}
  animate={{ width: 300, height: 200 }}
  transition={{ duration: 0.5 }}
/>
```
**Почему плохо:** `width` и `height` — layout-affecting свойства. Каждый кадр браузер
пересчитывает позиции ВСЕХ соседних элементов на странице. На мобилках это 100% jank.

### ✅ ХОРОШО: Анимация scale + clip-path

```tsx
// ПРАВИЛЬНО — GPU-ускорено, ноль Reflow
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 400, damping: 15 }}
  className="w-[300px] h-[200px]" // фиксированные размеры
/>
```

---

## 2. 🔴 useState для анимационных значений

### ❌ ПЛОХО: useState при движении мыши

```tsx
// АНТИПАТТЕРН — 60 re-render в секунду!
const [mouseX, setMouseX] = useState(0);
const [mouseY, setMouseY] = useState(0);

<div onMouseMove={(e) => {
  setMouseX(e.clientX);  // ← КАЖДОЕ движение мыши → re-render
  setMouseY(e.clientY);
}}>
  <div style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }} />
</div>
```
**Почему плохо:** `useState` → React reconciliation → Virtual DOM diff → DOM update.
При 60fps это ~16ms на кадр, из которых 80% уходит на бесполезные re-render.

### ✅ ХОРОШО: useMotionValue (Framer Motion)

```tsx
// ПРАВИЛЬНО — обновление DOM напрямую, без React re-render
import { motion, useMotionValue } from "framer-motion";

const mouseX = useMotionValue(0);
const mouseY = useMotionValue(0);

<div onMouseMove={(e) => {
  mouseX.set(e.clientX);  // ← без re-render, прямое обновление
  mouseY.set(e.clientY);
}}>
  <motion.div style={{ x: mouseX, y: mouseY }} />
</div>
```

---

## 3. 🔴 Over-animation ("Дискотека")

### ❌ ПЛОХО: Всё двигается одновременно

```tsx
// АНТИПАТТЕРН — 5 конкурирующих анимаций
<div>
  <motion.header animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity }} />    {/* Logo bounces */}
  <motion.nav animate={{ opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity }} />  {/* Nav pulses */}
  <motion.main initial={{ x: -100 }} animate={{ x: 0 }} />                             {/* Content slides */}
  <motion.aside animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity }} /> {/* Sidebar breathes */}
  <motion.footer animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity }} />       {/* Footer wobbles */}
</div>
```
**Почему плохо:** Глаз не знает, куда смотреть. 3 бесконечных loop-а конкурируют за внимание.
Навигация пульсирует → пользователь думает, что что-то сломалось. Принцип "Правило Кино" нарушен.

### ✅ ХОРОШО: Один акцент, остальное статично

```tsx
// ПРАВИЛЬНО — только Hero анимирован, остальное появляется тихо
<div>
  <header />  {/* Статичный — ориентир */}
  <nav />     {/* Статичная — частое взаимодействие */}
  <motion.main
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <motion.h1 /* Единственный Cinematic-вход */ />
  </motion.main>
  <aside />   {/* Статичный */}
  <footer />  {/* Статичный */}
</div>
```

---

## 4. 🔴 Слишком медленные переходы

### ❌ ПЛОХО: 2-секундная модалка

```tsx
// АНТИПАТТЕРН — пользователь ждёт 2 секунды, чтобы увидеть контент
<motion.div
  initial={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 2, ease: "easeInOut" }} // ← 2000ms!
/>
```
**Почему плохо:** Модалка — структурный элемент. NNGroup: > 500ms = "медленно".
Пользователь хочет увидеть содержимое, а не любоваться анимацией.

### ✅ ХОРОШО: 250ms snappy модалка

```tsx
// ПРАВИЛЬНО — мгновенно, но с ощущением "живого" spring
<motion.div
  initial={{ opacity: 0, scale: 0.92, y: 25 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 400, damping: 15 }} // ≈ 250ms
/>
```

---

## 5. 🔴 Отсутствие Reduced Motion

### ❌ ПЛОХО: Нет деградации

```tsx
// АНТИПАТТЕРН — вестибулярное расстройство = тошнота, головокружение
<motion.div
  animate={{ rotate: 360, y: [0, -50, 0] }}
  transition={{ repeat: Infinity, duration: 3 }}
/>
// A11y: пользователь с "Reduce Motion" всё равно видит бесконечное вращение
```

### ✅ ХОРОШО: Graceful degradation

```tsx
import { useReducedMotion } from "framer-motion";

const Component = () => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      animate={prefersReduced
        ? { opacity: 1 }  // ← только fade, без движения
        : { opacity: 1, y: 0, rotate: 0 }
      }
      initial={prefersReduced
        ? { opacity: 0 }
        : { opacity: 0, y: 50, rotate: -10 }
      }
      transition={prefersReduced
        ? { duration: 0.01 }  // ← мгновенно
        : { type: "spring", stiffness: 300, damping: 20 }
      }
    />
  );
};
```

---

## 6. 🔴 Монотонность ("Всё одинаково")

### ❌ ПЛОХО: Каждая секция — одинаковый fade-up

```tsx
// 4 секции подряд с идентичной анимацией
<RevealOnScroll direction="up"><Section1 /></RevealOnScroll>
<RevealOnScroll direction="up"><Section2 /></RevealOnScroll>
<RevealOnScroll direction="up"><Section3 /></RevealOnScroll>
<RevealOnScroll direction="up"><Section4 /></RevealOnScroll>
// Результат: "скучная одноплоская каша" — все летит снизу с одной скоростью
```

### ✅ ХОРОШО: Anti-Monotony System (≥2 оси различия)

```tsx
// Каждая секция отличается минимум по 2 осям из 4
<FlyInText text="Hero" />                                    // Направление=z, Персонаж=Cinematic
<RevealOnScroll direction="up"><Features /></RevealOnScroll>  // Направление=↑,  Персонаж=Smooth
<AnimatedList items={plans} />                                // Направление=↑,  Оркестровка=Stagger
<RevealOnScroll direction="left"><Reviews /></RevealOnScroll> // Направление=←,  Персонаж=Smooth
```

---

## 7. 🔴 Linear easing

### ❌ ПЛОХО: Робототкое движение

```tsx
// АНТИПАТТЕРН — объект движется с постоянной скоростью
<motion.div
  animate={{ x: 200 }}
  transition={{ duration: 0.5, ease: "linear" }}  // ← РОБОТ
/>
```
**Почему плохо:** В реальном мире ничто не двигается с постоянной скоростью.
Объекты разгоняются и тормозят. Linear = механическое, неживое ощущение.

### ✅ ХОРОШО: Естественный easing

```tsx
// ПРАВИЛЬНО — ease-out: быстрый старт, мягкая остановка
<motion.div
  animate={{ x: 200 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>

// ЕЩЁ ЛУЧШЕ — spring: физика пружины, прерываемый
<motion.div
  animate={{ x: 200 }}
  transition={{ type: "spring", stiffness: 400, damping: 15 }}
/>
```

---

## 8. 🔴 Не-кратные сетке дистанции

### ❌ ПЛОХО: Произвольные пиксели

```tsx
// АНТИПАТТЕРН — 17px и 37px не кратны 4px сетке Tailwind
<motion.div initial={{ y: 17. opacity: 0 }} animate={{ y: 0, opacity: 1 }} />
<motion.div initial={{ x: -37, opacity: 0 }} animate={{ x: 0, opacity: 1 }} />
```

### ✅ ХОРОШО: Кратные 4px (сетка Tailwind)

```tsx
// ПРАВИЛЬНО — 20px = 5 единиц, 32px = 8 единиц
<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} />
<motion.div initial={{ x: -32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} />
```

---

## 9. 🔴 Тяжёлые дети в анимированном дереве

### ❌ ПЛОХО: DataGrid внутри motion.div

```tsx
// АНТИПАТТЕРН — при layout-анимации пересчитывается весь DataGrid (1000+ строк)
<motion.div layout>
  <ComplexDataGrid rows={orders} columns={20} />
</motion.div>
```

### ✅ ХОРОШО: memo + изоляция

```tsx
import React from "react";
const MemoizedGrid = React.memo(ComplexDataGrid);

// Анимируется только обёртка, DataGrid не re-render-ится
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  <MemoizedGrid rows={orders} columns={20} />
</motion.div>
```

---

## 10. 🔴 Цвета не из палитры

### ❌ ПЛОХО: Случайные RGB

```tsx
// АНТИПАТТЕРН — откуда взялся этот фиолетовый? Его нет в дизайн-системе
<motion.div
  style={{
    background: "radial-gradient(circle, rgba(147,51,234,0.3), transparent)"
  }}
/>
```

### ✅ ХОРОШО: Цвета из палитры проекта

```tsx
// ПРАВИЛЬНО — sky-400 из палитры Smmplan с alpha
<motion.div
  style={{
    background: "radial-gradient(circle, rgba(56,189,248,0.12), transparent)"
    // sky-400 = rgb(56,189,248), alpha 0.12 для мягкого glow
  }}
/>
```
