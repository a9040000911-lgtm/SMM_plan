---
description: "Навык для работы с React 19 (Server Components, Hooks: useActionState, useFormStatus, useOptimistic)."
---

# React 19 Core Patterns

Проект Smmplan использует **React 19.0.0**. Вы обязаны применять современные паттерны, отказываясь от устаревших подходов React 18.

## 1. Server Components по умолчанию
- Все компоненты являются серверными по умолчанию (RSC).
- Используйте директиву `'use client'` только там, где необходима интерактивность (хуки состояния `useState`, эффекты `useEffect`, обработчики событий `onClick`).
- **Стремитесь сместить логику на сервер:** если можно передать данные компоненту через props из серверного родителя, делайте именно так.

## 2. Server Actions и Формы (React 19)
- При работе с формами используйте нативный HTML-тег `<form action={serverAction}>`.
- **`useActionState`**: Заменяет `useFormState`. Обязателен при обработке Server Actions внутри Client Components для получения результата (успех/ошибка).
  ```tsx
  import { useActionState } from 'react';
  // ...
  const [state, formAction, isPending] = useActionState(submitMyForm, initialState);
  ```
- **`useFormStatus`**: Используйте для извлечения состояния `pending` внутри компонентов-кнопок, являющихся потомками `<form>`. Это избавляет от пробрасывания `isLoading` через props.
  ```tsx
  import { useFormStatus } from 'react-dom';
  function SubmitButton() {
    const { pending } = useFormStatus();
    return <button disabled={pending}>Отправить</button>;
  }
  ```

## 3. Оптимистичный UI (`useOptimistic`)
- Для мгновенной реакции интерфейса (напр. кнопка лайка, переключение статуса) используйте `useOptimistic`.
- Паттерн: при вызове Action сначала вызывается функция оптимистичного обновления, затем выполняется запрос к серверу. При перерисовке с сервера оптимистичное состояние заменяется реальным.

## 4. Отказ от ForwardRef
В React 19 `ref` передается как обычный пропс. Не используйте `forwardRef`.
```tsx
// React 19 
function MyInput({ type, ref }) {
  return <input type={type} ref={ref} />;
}
```

## 5. Metadata и title/meta теги
React 19 понимает теги `<title>`, `<meta>`, и `<link>` прямо в JSX компонентах. Они автоматически будут "подняты" в `<head>`. (В Smmplan это управляется Next.js Metadata API, но для локальных нужд можно использовать).

**Соблюдение этих правил обязательно для кодовой базы Smmplan.**
