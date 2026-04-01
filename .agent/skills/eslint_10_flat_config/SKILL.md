---
description: "Навык работы с ESLint 10 и форматом Flat Config (eslint.config.mjs)."
---

# ESLint 10 (Flat Config) Mastery

В 2026 году Smmplan использует **ESLint v10** с современной архитектурой конфигурации (Flat Config).

## 1. Конфигурация
- Больше нет `.eslintrc.json`, `.eslintignore` или `.eslintrc.js`.
- Вся настройка находится в **одном** файле: `eslint.config.mjs` (или `.js`, `.ts`) в корне проекта.
- Конфигурация экспортирует плоский массив объектов (Array of configuration objects).

```js
// Пример eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import nextPlugin from "@next/eslint-plugin-next";

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            react: reactPlugin,
            "@next/next": nextPlugin,
        },
        rules: {
            "react/react-in-jsx-scope": "off", // React 19 не требует импорта React
            "@next/next/no-img-element": "warn"
        }
    }
];
```

## 2. Игнорирование файлов
- Файл `.eslintignore` устарел. Для игнорирования файлов добавьте объект с полем `ignores` в массив конфигурации:
```js
export default [
    { ignores: [".next/", "node_modules/", "coverage/"] },
    // остальные конфиги...
];
```

## 3. Написание кода без ошибок
- Никогда не оставляйте `any`. TypeScript должен быть строгим, и ESLint v10 будет ругаться на неявные `any`.
- При редактировании файлов, не переопределяйте и не подавляйте правила `eslint-disable` без крайней необходимости. Если правило мешает архитектурному паттерну (например, пустой массив зависимостей в `useEffect`, который намеренно так задуман), напишите комментарий сверху.
