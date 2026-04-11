# Текстовые атомы (Typography Motion Templates)

> Все шаблоны copy-paste-ready. Каждый помечен `"use client"` для Next.js App Router.

---

## Т1: Block Fade-up (Базовый текстовый вход)

Весь текстовый блок плавно приезжает снизу. Самый частый и лёгкий вариант.

```tsx
"use client";
import { motion } from "framer-motion";

export const TextFadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut", delay }}
  >
    {children}
  </motion.div>
);
```

---

## Т2: Word-by-Word Reveal (Просвечивание по словам)

Каждое слово проявляется отдельно с каскадной задержкой. Стиль Apple / Stripe.

```tsx
"use client";
import { motion } from "framer-motion";

const wordVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" }
  })
};

export const WordReveal = ({ text, className }: { text: string; className?: string }) => {
  const words = text.split(" ");
  return (
    <p className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={wordVariants}
          initial="hidden"
          animate="visible"
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
};
```

---

## Т3: Character Stagger (Побуквенный каскад)

Каждая буква заголовка влетает по очереди. Только для коротких Hero-заголовков (до ~30 символов).

```tsx
"use client";
import { motion } from "framer-motion";

const charVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const CharStagger = ({ text, className }: { text: string; className?: string }) => (
  <motion.h1
    initial="hidden"
    animate="visible"
    transition={{ staggerChildren: 0.03 }}
    className={className}
    aria-label={text}
  >
    {text.split("").map((char, i) => (
      <motion.span key={i} variants={charVariants} className="inline-block">
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </motion.h1>
);
```

---

## Т4: Typewriter (Печатная машинка)

Побуквенная "печать" текста с мигающим курсором. Для ИИ-ассистентов и чат-интерфейсов.

```tsx
"use client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

export const Typewriter = ({ text, speed = 40 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-text-bottom"
      />
    </span>
  );
};
```

---

## Т5: Gradient Text Shimmer (Переливающийся градиент)

По крупному заголовку бежит переливающийся блик. Чистый CSS, без Framer Motion.

```css
/* globals.css */
@keyframes shimmer-text {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.text-shimmer {
  background: linear-gradient(90deg, currentColor 40%, rgba(255,255,255,0.8) 50%, currentColor 60%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-text 3s linear infinite;
}
```
```tsx
// Использование:
<h1 className="text-shimmer text-5xl font-bold">Premium Plan</h1>
```

---

## Т6: 3D Fly-in (Полёт из-за камеры)

Классический кинематографический вход текста из After Effects.

```tsx
"use client";
import { motion } from "framer-motion";

export const FlyInText = ({ text, className }: { text: string; className?: string }) => (
  <div style={{ perspective: "1000px", transformStyle: "preserve-3d" }}>
    <motion.h1
      initial={{ opacity: 0, z: -800, scale: 0.3, filter: "blur(15px)" }}
      animate={{ opacity: 1, z: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className={className ?? "text-6xl font-bold tracking-tight"}
    >
      {text}
    </motion.h1>
  </div>
);
```

---

## Т7: Variable Font Shared Letter (Деформация и "игра буквой")

Передовая техника 2025–2026: одна буква деформируется через **Variable Font Axes**. Может принадлежать двум словам одновременно (**Shared Letter Typography** / **Crossword Typography**).

**Названия техники:**
- **Shared Letter Typography** — буква принадлежит двум словам одновременно
- **Variable Font Axis Animation** — анимация осей `wght`, `wdth`, `slnt` шрифта
- **Kinetic Typography** — общий зонтичный термин

### CSS-only вариант

```css
/* globals.css — для Variable Font */
@keyframes letter-breathe {
  0%, 100% { font-variation-settings: "wght" 400, "wdth" 100; }
  50%      { font-variation-settings: "wght" 900, "wdth" 130; }
}
.vf-animate {
  font-family: 'Inter', sans-serif; /* Variable Font required */
  display: inline-block;
  animation: letter-breathe 2s ease-in-out infinite alternate;
}
```

### React + Framer Motion вариант

```tsx
"use client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

/**
 * Shared Letter: одна буква принадлежит двум словам.
 * @param before — буквы ДО общей буквы (из 1-го слова)
 * @param shared — общая буква, которая "играет" деформацией
 * @param after  — буквы ПОСЛЕ общей буквы (из 2-го слова)
 */
export const SharedLetter = ({ before, shared, after, className }: {
  before: string; shared: string; after: string; className?: string;
}) => {
  const weight = useMotionValue(400);
  const width = useMotionValue(100);

  useEffect(() => {
    const ctrl1 = animate(weight, [400, 900, 400], { repeat: Infinity, duration: 3, ease: "easeInOut" });
    const ctrl2 = animate(width, [100, 130, 100], { repeat: Infinity, duration: 3, ease: "easeInOut" });
    return () => { ctrl1.stop(); ctrl2.stop(); };
  }, [weight, width]);

  const fontVariation = useTransform(
    [weight, width],
    ([w, wd]) => `"wght" ${w}, "wdth" ${wd}`
  );

  return (
    <h1 className={className ?? "text-6xl font-bold tracking-tight"}>
      <span>{before}</span>
      <motion.span
        style={{ fontVariationSettings: fontVariation, display: "inline-block" }}
        className="text-primary"
      >
        {shared}
      </motion.span>
      <span>{after}</span>
    </h1>
  );
};

// Использование: <SharedLetter before="SM" shared="M" after="PLAN" />
// Визуально: SM[M]PLAN — буква M "дышит" и принадлежит обоим словам
```

**Требования:**
- Шрифт ОБЯЗАН быть Variable (проверить на [wakamaifondue.com](https://wakamaifondue.com/)).
- Техника `Splitting.js` позволяет разбить любой текст на `<span>` побуквенно.
- На мобильных — деградировать до статичного bold.

### Практические примеры применения

| Паттерн | Как это работает | Пример для Smmplan |
|---------|-----------------|-------------------|
| **1. Hover Weight Navigation** | При наведении `wght` плавно меняется с 400 до 700. Variable Font сохраняет ширину — нет сдвига layout. | Боковое меню админки: наводишь на "Заказы" → текст "утолщается" |
| **2. Hero Shared Letter** | Буква на стыке двух слов бренда "дышит" — привлекает внимание. | `SM`**`M`**`PLAN` — буква M пульсирует |
| **3. Pricing Emphasis** | Цена анимируется по оси `wght` (400→900) при появлении во viewport. | Цена "$9.99" → при скролле "утяжеляется" |
| **4. Brand Logo Mark** | Буквы логотипа медленно "дышат" с разной фазой. Стоячая волна с `animation-delay`. | Логотип "SMMPLAN" в футере |
| **5. Interactive Cursor Proximity** | Буквы реагируют на позицию курсора: ближайшие к мышке "утолщаются". | Hero-секция лендинга |
| **6. Scroll-driven Weight Gradient** | Заголовок переходит от Thin (100) к Black (900) по мере скролла. | "Ваш бизнес растёт" |
| **7. Form Validation Feedback** | При ошибке `wdth` Label расширяется + краснеет. При успехе — сужается + зеленеет. | Label "Email" при валидации |

---

## Т8: Scroll-driven Word Reveal (Текст проявляется при скролле)

Текст "проявляется" по мере скролла — каждое слово становится читаемым, когда пользователь до него долистывает. Стиль apple.com.

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const ScrollWordReveal = ({ text, className }: { text: string; className?: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });

  const words = text.split(" ");

  return (
    <p ref={ref} className={className ?? "text-4xl font-semibold leading-relaxed"}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <ScrollWord key={i} word={word} range={[start, end]} progress={scrollYProgress} />
        );
      })}
    </p>
  );
};

const ScrollWord = ({ word, range, progress }: {
  word: string; range: [number, number]; progress: any;
}) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.3em]">
      {word}
    </motion.span>
  );
};
```
