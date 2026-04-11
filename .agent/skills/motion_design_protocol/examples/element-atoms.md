# Элементные атомы (Component Motion Templates)

> Все шаблоны copy-paste-ready. Spring presets импортируются из `@/lib/motion-presets`.

---

## Spring Presets (src/lib/motion-presets.ts)

```tsx
// src/lib/motion-presets.ts (рекомендуемое место хранения)
export const SPRING = {
  snappy:    { type: "spring" as const, stiffness: 400, damping: 15, mass: 0.8 },
  smooth:    { type: "spring" as const, stiffness: 200, damping: 25, mass: 1 },
  heavy:     { type: "spring" as const, stiffness: 150, damping: 10, mass: 2.5 },
  elastic:   { type: "spring" as const, stiffness: 500, damping: 8,  mass: 1 },
  gentle:    { type: "spring" as const, stiffness: 120, damping: 20, mass: 1.2 },
} as const;

export const TWEEN = {
  smooth:     { type: "tween" as const, duration: 0.3, ease: "easeOut" as const },
  cinematic:  { type: "tween" as const, duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  quick:      { type: "tween" as const, duration: 0.15, ease: "easeOut" as const },
} as const;
```

---

## Э1: Staggered List (Каскад элементов)

Для списков услуг, провайдеров, истории заказов. Включая корректный exit при удалении.

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/motion-presets";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show:   { opacity: 1, y: 0, transition: SPRING.snappy },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export const AnimatedList = ({ items, keyFn }: { items: any[]; keyFn: (item: any) => string }) => (
  <motion.ul variants={container} initial="hidden" animate="show" className="space-y-2">
    <AnimatePresence>
      {items.map((entry) => (
        <motion.li key={keyFn(entry)} variants={item} exit="exit" layout>
          {entry}
        </motion.li>
      ))}
    </AnimatePresence>
  </motion.ul>
);
```

---

## Э2: Spotlight Card (Голографическое свечение)

Курсор мыши "светит" по карточке. Для карточек тарифов, дашбордов.

```tsx
"use client";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export const SpotlightCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 ${className}`}
      onMouseMove={({ currentTarget, clientX, clientY }) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(56,189,248,0.12), transparent 80%)`,
        }}
      />
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
};
```

---

## Э3: Interactive Modal

Модальное окно с exit-анимацией (Snappy Bounce). Backdrop с blur.

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "@/lib/motion-presets";

export const AnimatedModal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 25 }}
          transition={SPRING.snappy}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl p-6"
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
```

---

## Э4: Scroll Reveal (Появление при скролле)

Универсальная обёртка: ребёнок появляется при входе во viewport.

```tsx
"use client";
import { motion } from "framer-motion";

type Dir = "up" | "down" | "left" | "right";
const offsets: Record<Dir, { x?: number; y?: number }> = {
  up:    { y: 30 },
  down:  { y: -30 },
  left:  { x: -30 },
  right: { x: 30 },
};

export const RevealOnScroll = ({ children, direction = "up", delay = 0 }: {
  children: React.ReactNode; direction?: Dir; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, ...offsets[direction] }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, ease: "easeOut", delay }}
  >
    {children}
  </motion.div>
);
```

---

## Э5: Button State Machine (idle → loading → success → error)

Кнопка с 4 состояниями. Критично для платёжных форм.

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";

type BtnState = "idle" | "loading" | "success" | "error";

const icons: Record<BtnState, string> = {
  idle: "", loading: "⏳", success: "✓", error: "✗",
};

export const StatefulButton = ({ state, label, onClick }: {
  state: BtnState; label: string; onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    disabled={state === "loading"}
    whileTap={state === "idle" ? { scaleX: 1.03, scaleY: 0.95 } : {}}
    animate={state === "error" ? { x: [0, -6, 6, -4, 4, 0] } : {}}
    transition={{ type: "spring", stiffness: 500, damping: 15 }}
    className="relative overflow-hidden rounded-lg px-6 py-3 font-medium text-white bg-blue-600 disabled:opacity-70"
  >
    <AnimatePresence mode="wait">
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {state === "idle" ? label : icons[state]}
      </motion.span>
    </AnimatePresence>
  </motion.button>
);
```

---

## Э6: Skeleton Shimmer (CSS-only, Zero JS)

Мерцающий загрузчик. Чистый CSS — не тянет Framer Motion в серверные компоненты.

```css
/* globals.css */
@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.skeleton {
  position: relative;
  overflow: hidden;
  background: #e2e8f0; /* slate-200 */
  border-radius: 0.5rem;
}
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
```
```tsx
// Использование без "use client" — работает в RSC!
export const SkeletonLine = ({ w = "100%", h = "1rem" }: { w?: string; h?: string }) => (
  <div className="skeleton" style={{ width: w, height: h }} />
);
```

---

## Э7: Toast Notification

Всплывающее уведомление снизу-справа с auto-dismiss.

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";

export const Toast = ({ message, isVisible }: { message: string; isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);
```
