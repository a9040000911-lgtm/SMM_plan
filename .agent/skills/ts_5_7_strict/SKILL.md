---
description: "Навык работы со строгим TypeScript 5.7+ в Smmplan."
---

# TypeScript 5.7+ Strict Standard

## 1. Нулевая толерантность к `any`
В Smmplan строго запрещено использование `any`. 
- При работе с внешними API используйте `unknown` и Zod-схемы для валидации (например, `z.object({...}).parse(data)`).
- Если нужно временно обойти тип, используйте конкретный интерфейс или `Record<string, unknown>`.

## 2. Типизация Server Actions
React 19 Server Actions требуют правильной сигнатуры.
Форма принимает `action={myAction}`, где:
```ts
// my-action.ts
"use server";

// Если используется useActionState (предыдущее состояние обязательно первым аргументом)
export async function submitMyForm(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    // ...
    return { success: true, message: 'Done' };
}
```

## 3. Utility Types (TypeScript 5.7)
- Используйте возможности TS 5+, такие как `NoInfer`, чтобы улучшить вывод типов.
- Используйте `satisfies` вместо `as` для сохранения узких типов (narrowed types) в объектах конфигурации.
```ts
const colors = {
    primary: "#2563eb",
    secondary: "#10b981"
} satisfies Record<string, string>;
```

## 4. Prisma Types
Всегда используйте сгенерированные типы Prisma (например, `User`, `Order`, `InternalService`). При необходимости извлечения только части сущности, используйте `Prisma.UserGetPayload<{ select: { id: true, email: true } }>` вместо ручного дублирования интерфейсов.
