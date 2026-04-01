---
description: "Главный координатор стека Smmplan: объединяет Next.js 16, React 19, Tailwind CSS 4, ESLint 10 (Flat Config) и TypeScript 5.7+."
---

# Smmplan Tech Stack Master (Feb 2026)

Этот навык объединяет все ключевые технологии проекта Smmplan и устанавливает жесткие правила их совместного использования.

## 🚀 Основной Стек
- **Framework**: Next.js 16.0.10 (App Router, Turbopack)
- **UI Library**: React 19.0.0 (Server Components, Actions)
- **Styling**: Tailwind CSS 4.0.0 (No config file, `@theme` block in CSS)
- **Linting**: ESLint 10.0.0 (Flat Config `eslint.config.mjs`)
- **Language**: TypeScript 5.7+ (Strict mode)
- **Database**: PostgreSQL via Prisma ORM

## ⚠️ Критические Правила Совместимости Смартов (Smart Interops)

1. **Server Actions vs React 19 Hooks**:
   - Всегда используйте `useActionState` (React 19) вместо устаревшего `useFormState` для форм, работающих с Server Actions.
   - Используйте `useFormStatus` для отслеживания состояния загрузки кнопок внутри `<form>`.

2. **Tailwind 4 vs Next.js 16**:
   - В Tailwind v4 **нет** файла `tailwind.config.js` или `tailwind.config.ts`.
   - Если нужно добавить новые токены дизайна (цвета, шрифты), делайте это исключительно через `@theme` директиву в глобальном CSS файле (`src/styles/globals.css`).
   - Используйте CSS переменные и встроенные утилиты Tailwind 4 (например, динамические значения `bg-[#123456]`).

3. **ESLint 10 Flat Config**:
   - Никаких файлов `.eslintrc.json`. Используйте ТОЛЬКО `eslint.config.mjs` с массивом объектов.
   - Плагины должны быть совместимы с Flat Config (например, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`).

4. **Интеграция с UI_UX_DESIGN и VISIONARY_UI_ARCHITECT**:
   - При написании компонентов всегда применяйте стили, описанные в скиллах дизайна, но используйте **синтаксис Tailwind 4**.
   - Не используйте `@apply` слишком часто, Tailwind 4 оптимизирован для inline-утилит.

5. **Prisma & Next.js Cache**:
   - В Next.js 16 агрессивное кэширование (даже в App Router). При мутациях в БД обязательно используйте `revalidatePath` или `revalidateTag` в Server Actions, иначе UI не обновится!

## План Действий Разработчика
При открытии любой новой задачи:
1. Проверьте, где выполняется код (Client Component `use client` vs Server Component).
2. Используйте `const data = await prisma...` прямо в Server Components.
3. Передавайте только сериализуемые данные через границы Client/Server.
