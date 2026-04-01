# Анализ кодовой базы: Smmplan

**Дата анализа:** 2026-03-25 22:44

## 📊 Сводка

| Метрика | Значение |
|---------|----------|
| Страниц (Pages) | 95 |
| API Endpoints | 81 |
| Server Actions | 212 |
| UI Компоненты | 145 |
| Текстовых элементов | 1517 |
| Обнаружено journeys | 95 |

## 🗺️ Маршруты (Routes)

### Страницы

| Путь | Файл | Параметры |
|------|------|-----------|
| `/` | `src\app\(client)\page.tsx` | — |
| `//about` | `src\app\(client)\about\page.tsx` | — |
| `//academy` | `src\app\(client)\academy\page.tsx` | — |
| `//academy/:slug` | `src\app\(client)\academy\[slug]\page.tsx` | slug |
| `//academy/guides/:platform` | `src\app\(client)\academy\guides\[platform]\page.tsx` | platform |
| `//ai-manifest` | `src\app\(client)\ai-manifest\page.tsx` | — |
| `//cart` | `src\app\(client)\cart\page.tsx` | — |
| `//catalog` | `src\app\(client)\catalog\page.tsx` | — |
| `//dashboard` | `src\app\(client)\dashboard\page.tsx` | — |
| `//dashboard/api` | `src\app\(client)\dashboard\api\page.tsx` | — |
| `//dashboard/orders` | `src\app\(client)\dashboard\orders\page.tsx` | — |
| `//dashboard/orders/:id` | `src\app\(client)\dashboard\orders\[id]\page.tsx` | id |
| `//dashboard/orders/new` | `src\app\(client)\dashboard\orders\new\page.tsx` | — |
| `//dashboard/premium` | `src\app\(client)\dashboard\premium\page.tsx` | — |
| `//dashboard/premium/catalog` | `src\app\(client)\dashboard\premium\catalog\page.tsx` | — |
| `//dashboard/premium/orders` | `src\app\(client)\dashboard\premium\orders\page.tsx` | — |
| `//dashboard/referrals` | `src\app\(client)\dashboard\referrals\page.tsx` | — |
| `//dashboard/scheduled` | `src\app\(client)\dashboard\scheduled\page.tsx` | — |
| `//dashboard/settings` | `src\app\(client)\dashboard\settings\page.tsx` | — |
| `//dashboard/support` | `src\app\(client)\dashboard\support\page.tsx` | — |
| `//dashboard/transactions` | `src\app\(client)\dashboard\transactions\page.tsx` | — |
| `//docs/:slug` | `src\app\(client)\docs\[slug]\page.tsx` | slug |
| `//faq` | `src\app\(client)\faq\page.tsx` | — |
| `//glossary` | `src\app\(client)\glossary\page.tsx` | — |
| `//legal/:slug` | `src\app\(client)\legal\[slug]\page.tsx` | slug |
| `//login` | `src\app\(client)\login\page.tsx` | — |
| `//mass` | `src\app\(client)\mass\page.tsx` | — |
| `//mass-order` | `src\app\(client)\mass-order\page.tsx` | — |
| `//orders` | `src\app\(client)\orders\page.tsx` | — |
| `//orders/:id` | `src\app\(client)\orders\[id]\page.tsx` | id |
| `//profile` | `src\app\(client)\profile\page.tsx` | — |
| `//referrals` | `src\app\(client)\referrals\page.tsx` | — |
| `//register` | `src\app\(client)\register\page.tsx` | — |
| `//settings` | `src\app\(client)\settings\page.tsx` | — |
| `//support` | `src\app\(client)\support\page.tsx` | — |
| `/admin` | `src\app\admin\page.tsx` | — |
| `/admin/advocacy/nps` | `src\app\admin\advocacy\nps\page.tsx` | — |
| `/admin/advocacy/reviews` | `src\app\admin\advocacy\reviews\page.tsx` | — |
| `/admin/analytics/churn` | `src\app\admin\analytics\churn\page.tsx` | — |
| `/admin/bug-reports` | `src\app\admin\bug-reports\page.tsx` | — |
| `/admin/bug-reports/:id` | `src\app\admin\bug-reports\[id]\page.tsx` | id |
| `/admin/cms` | `src\app\admin\cms\page.tsx` | — |
| `/admin/cms-studio` | `src\app\admin\cms-studio\page.tsx` | — |
| `/admin/cms-studio/academy` | `src\app\admin\cms-studio\academy\page.tsx` | — |
| `/admin/cms-studio/academy/editor/:id` | `src\app\admin\cms-studio\academy\editor\[id]\page.tsx` | id |
| `/admin/content` | `src\app\admin\content\page.tsx` | — |
| `/admin/employees` | `src\app\admin\employees\page.tsx` | — |
| `/admin/expenses` | `src\app\admin\expenses\page.tsx` | — |
| `/admin/finance` | `src\app\admin\finance\page.tsx` | — |
| `/admin/knowledge-base` | `src\app\admin\knowledge-base\page.tsx` | — |
| `/admin/legal` | `src\app\admin\legal\page.tsx` | — |
| `/admin/login` | `src\app\admin\login\page.tsx` | — |
| `/admin/logs` | `src\app\admin\logs\page.tsx` | — |
| `/admin/loyalty` | `src\app\admin\loyalty\page.tsx` | — |
| `/admin/news` | `src\app\admin\news\page.tsx` | — |
| `/admin/news/:id/broadcast` | `src\app\admin\news\[id]\broadcast\page.tsx` | id |
| `/admin/news/new` | `src\app\admin\news\new\page.tsx` | — |
| `/admin/orders` | `src\app\admin\orders\page.tsx` | — |
| `/admin/orders/:id` | `src\app\admin\orders\[id]\page.tsx` | id |
| `/admin/orders/churn-dashboard` | `src\app\admin\orders\churn-dashboard\page.tsx` | — |
| `/admin/orders/create` | `src\app\admin\orders\create\page.tsx` | — |
| `/admin/projects` | `src\app\admin\projects\page.tsx` | — |
| `/admin/projects/:id` | `src\app\admin\projects\[id]\page.tsx` | id |
| `/admin/projects/:id/services` | `src\app\admin\projects\[id]\services\page.tsx` | id |
| `/admin/promo-codes` | `src\app\admin\promo-codes\page.tsx` | — |
| `/admin/providers` | `src\app\admin\providers\page.tsx` | — |
| `/admin/providers/:id` | `src\app\admin\providers\[id]\page.tsx` | id |
| `/admin/providers/new` | `src\app\admin\providers\new\page.tsx` | — |
| `/admin/reports` | `src\app\admin\reports\page.tsx` | — |
| `/admin/reviews` | `src\app\admin\reviews\page.tsx` | — |
| `/admin/scheduled` | `src\app\admin\scheduled\page.tsx` | — |
| `/admin/security` | `src\app\admin\security\page.tsx` | — |
| `/admin/services` | `src\app\admin\services\page.tsx` | — |
| `/admin/services/:id` | `src\app\admin\services\[id]\page.tsx` | id |
| `/admin/services/categories` | `src\app\admin\services\categories\page.tsx` | — |
| `/admin/services/curator` | `src\app\admin\services\curator\page.tsx` | — |
| `/admin/services/guide` | `src\app\admin\services\guide\page.tsx` | — |
| `/admin/services/health` | `src\app\admin\services\health\page.tsx` | — |
| `/admin/services/import` | `src\app\admin\services\import\page.tsx` | — |
| `/admin/services/markup` | `src\app\admin\services\markup\page.tsx` | — |
| `/admin/services/new` | `src\app\admin\services\new\page.tsx` | — |
| `/admin/settings` | `src\app\admin\settings\page.tsx` | — |
| `/admin/support` | `src\app\admin\support\page.tsx` | — |
| `/admin/support/:id` | `src\app\admin\support\[id]\page.tsx` | id |
| `/admin/support/macros` | `src\app\admin\support\macros\page.tsx` | — |
| `/admin/support/templates` | `src\app\admin\support\templates\page.tsx` | — |
| `/admin/transactions` | `src\app\admin\transactions\page.tsx` | — |
| `/admin/users` | `src\app\admin\users\page.tsx` | — |
| `/admin/users/:id` | `src\app\admin\users\[id]\page.tsx` | id |
| `/admin/users/create` | `src\app\admin\users\create\page.tsx` | — |
| `/auth/magic` | `src\app\auth\magic\page.tsx` | — |
| `/docs/offer` | `src\app\docs\offer\page.tsx` | — |
| `/docs/policy` | `src\app\docs\policy\page.tsx` | — |
| `/docs/refund` | `src\app\docs\refund\page.tsx` | — |
| `/docs/rules` | `src\app\docs\rules\page.tsx` | — |

### API Endpoints

| Путь | Методы | Авторизация |
|------|--------|-------------|
| `/api/admin/advocacy/nps` | GET | ✅ |
| `/api/admin/advocacy/reviews` | GET, PATCH | ✅ |
| `/api/admin/auth` | POST | ✅ |
| `/api/admin/auth/reset-password` | POST | ❌ |
| `/api/admin/check-views` | GET | ❌ |
| `/api/admin/churn/at-risk` | GET | ✅ |
| `/api/admin/finance/rates` | GET | ✅ |
| `/api/admin/force-confirm` | GET | ❌ |
| `/api/admin/force-sync-payments` | GET | ❌ |
| `/api/admin/legal` | GET, POST, PUT, DELETE | ❌ |
| `/api/admin/loyalty/stats` | GET | ✅ |
| `/api/admin/media/:fileId` | GET | ✅ |
| `/api/admin/orders/:id/run-drip` | POST | ✅ |
| `/api/admin/orders/scheduled/:id` | DELETE | ✅ |
| `/api/admin/platforms` | GET | ❌ |
| `/api/admin/projects/services/override` | POST | ✅ |
| `/api/admin/providers` | GET, POST | ✅ |
| `/api/admin/services` | GET | ✅ |
| `/api/admin/services/analyze` | POST | ❌ |
| `/api/admin/services/availability` | POST | ✅ |
| `/api/admin/services/bulk-update` | POST | ❌ |
| `/api/admin/services/health` | GET | ❌ |
| `/api/admin/services/import` | GET, POST | ❌ |
| `/api/admin/services/markup` | GET, POST | ❌ |
| `/api/admin/services/markup/ladder` | GET, POST | ❌ |
| `/api/admin/stats` | GET | ✅ |
| `/api/admin/support/tickets` | GET | ❌ |
| `/api/admin/support/tickets/:id` | GET | ❌ |
| `/api/admin/support/tickets/:id/analyze` | POST | ✅ |
| `/api/admin/support/user-dialog/:id` | GET | ❌ |
| `/api/admin/support/users` | GET | ❌ |
| `/api/admin/system/projects` | GET | ✅ |
| `/api/auth/:...nextauth` | — | ❌ |
| `/api/auth/forgot-password` | POST | ❌ |
| `/api/auth/register` | POST | ❌ |
| `/api/auth/reset-password` | POST | ❌ |
| `/api/auth/telegram` | POST | ❌ |
| `/api/auth/verify-2fa` | POST | ❌ |
| `/api/client/achievements` | GET | ✅ |
| `/api/client/achievements/claim` | POST | ✅ |
| `/api/client/ai/recommendations` | GET | ✅ |
| `/api/client/auth/check-email` | POST | ❌ |
| `/api/client/auth/send-code` | POST | ❌ |
| `/api/client/bug-reports` | GET, POST | ✅ |
| `/api/client/challenges` | GET | ✅ |
| `/api/client/config` | GET | ❌ |
| `/api/client/legal` | GET | ❌ |
| `/api/client/legal/:slug` | GET | ❌ |
| `/api/client/orders` | GET, POST | ✅ |
| `/api/client/orders/:id` | GET | ✅ |
| `/api/client/orders/:id/churn` | GET | ✅ |
| `/api/client/orders/scheduled/:id` | DELETE | ✅ |
| `/api/client/payments` | POST | ✅ |
| `/api/client/referrals/leaderboard` | GET | ✅ |
| `/api/client/reviews` | GET, POST | ✅ |
| `/api/client/services` | GET | ✅ |
| `/api/client/services/:id` | GET | ❌ |
| `/api/client/stats` | GET | ✅ |
| `/api/client/support` | GET, POST | ✅ |
| `/api/client/transactions` | GET | ✅ |
| `/api/client/user` | GET, PATCH | ✅ |
| `/api/debug-session` | GET | ✅ |
| `/api/dev/seed` | GET | ❌ |
| `/api/diag` | GET | ❌ |
| `/api/docs` | — | ❌ |
| `/api/health` | GET | ❌ |
| `/api/internal/global-settings` | GET | ❌ |
| `/api/internal/project-lookup` | GET | ❌ |
| `/api/reviews` | POST | ✅ |
| `/api/tma/analyze` | POST | ❌ |
| `/api/tma/orders` | POST | ❌ |
| `/api/tma/orders/list` | GET | ❌ |
| `/api/tma/orders/mass` | POST | ❌ |
| `/api/tma/payments` | POST | ❌ |
| `/api/tma/services` | GET | ❌ |
| `/api/tma/support` | POST | ❌ |
| `/api/tma/user` | GET | ❌ |
| `/api/v1/orders` | POST | ❌ |
| `/api/v2` | POST | ❌ |
| `/api/webhooks/robokassa` | GET, POST | ❌ |
| `/api/webhooks/yookassa` | POST | ❌ |

## ⚡ Server Actions

| Название | Файл | Параметры |
|----------|------|-----------|
| `updateService` | `coverage\lcov-report\app\admin\services\actions.ts.html` | serviceId: string, data: any |
| `getServiceCategories` | `coverage\lcov-report\app\admin\services\actions.ts.html` | — |
| `bulkMoveServicesToCategoryAction` | `coverage\lcov-report\app\admin\services\bulk-actions.ts.html` | serviceIds: string[], targetCategoryId: string, targetPlatform: string |
| `getCtx` | `coverage\lcov-report\app\admin\users\actions.ts.html` | — |
| `createUserAction` | `coverage\lcov-report\app\admin\users\actions.ts.html` | prevState: CreateUserState, formData: FormData |
| `updateCredentialsAction` | `coverage\lcov-report\app\admin\users\actions.ts.html` | userId: string, data: { email?: string, password?: string } |
| `changeRoleAction` | `coverage\lcov-report\app\admin\users\actions.ts.html` | userId: string, newRole: Role |
| `adjustBalanceAction` | `coverage\lcov-report\app\admin\users\actions.ts.html` | userId: string, amount: number, reason: string |
| `analyzePremiumLink` | `src\app\(client)\dashboard\premium\actions.ts` | link: string |
| `getPremiumServices` | `src\app\(client)\dashboard\premium\actions.ts` | platform?: string |
| `claimAchievementAction` | `src\app\(client)\profile\actions.ts` | achievementId: string |
| `getUserAchievementsAction` | `src\app\(client)\profile\actions.ts` | userId: string |
| `globalSearchAction` | `src\app\admin\global-search-action.ts` | query: string |
| `getDashboardChartsData` | `src\app\admin\analytics\actions.ts` | — |
| `getChurnStatsAction` | `src\app\admin\analytics\actions.ts` | — |
| `getChurnStatsAction` | `src\app\admin\analytics\churn\actions.ts` | — |
| `parseGuaranteeAction` | `src\app\admin\analytics\churn\actions.ts` | input: string |
| `logoutAction` | `src\app\admin\auth\actions.ts` | — |
| `updateBugStatus` | `src\app\admin\bug-reports\actions.ts` | bugId: string, status: any, rewardAmount?: number |
| `updateCmsStringsAction` | `src\app\admin\cms\actions.ts` | projectId: string, updates: Record<string, string> |
| ... и ещё 192 действий | | |

## 🖱️ UI Компоненты (интерактивные элементы)

Всего кнопок: **206**
Всего ссылок: **112**

### Примеры кнопок

**dark_premium:**
- Вход (Button component)
**light_clean:**
- Попробовать (Button component)
**page:**
- Заказать услуги для {data.name} (Button component)

## 📝 Текстовые элементы (локализация)

### Text (845)

- "Личный менеджер"
- "Закрывающие документы"
- "воздушный"
- "накрутка подписчиков"
- "купить лайки"
- "просмотры телеграм"
- "раскрутка инстаграм"
- "продвижение вконтакте"
- "тик ток продвижение"
- "Надежная платформа для быстрого продвижения в социальных сетях. Заказывайте подписчиков, лайки, просмотры и реакции в один клик с гарантией качества и моментальным стартом."
- ... и ещё 835

### Placeholder (106)

- "Какую услугу ищем?"
- "000 000"
- "Поиск по элитным услугам..."
- "Ваш пароль"
- "000000"
- "Ваш ник"
- "Минимум 6 символов"
- "Текущий пароль"
- "Новый пароль"
- "Подтвердите пароль"
- ... и ещё 96

### Label (253)

- "Лайки"
- "Комментарии"
- "Репосты"
- "Заказов выполнено"
- "Довольных клиентов"
- "Лет на рынке"
- "Выполняем за"
- "3 сек."
- "Все статьи"
- "ВКонтакте"
- ... и ещё 243

### Error (222)

- "Не удалось подобрать услуги для ваших стратегий. Пожалуйста, попробуйте позже."
- "Ошибка при оформлении заказа"
- "Ошибка соединения с сервером. Попробуйте обновить страницу."
- "Код отправлен на вашу почту!"
- "Не удалось отправить код"
- "Ошибка сети при отправке кода"
- "Ошибка"
- "Ошибка сети"
- "Неверный код"
- "Ошибка сети"
- ... и ещё 212

### Success (86)

- "Отчет обновлен"
- "Статья удалена"
- "Статья сохранена"
- "Пароль успешно изменен. Теперь вы можете войти."
- "Статус обновлен"
- "Промокод удален"
- "Промокод создан"
- "Синхронизация успешно выполнена!"
- "Цена обновлена"
- "включена"
- ... и ещё 76

### Button (5)

- "Ссылка"
- "Проверить"
- "Включить"
- "Отключить"
- "Удалить"

## 🔄 Обнаруженные User Journeys

### JOURNEY-home--
**Модуль:** home
**Роль:** USER
**Путь:** `/`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу / | Страница загружается |

### JOURNEY-about---about
**Модуль:** about
**Роль:** USER
**Путь:** `//about`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //about | Страница загружается |

### JOURNEY-academy---academy
**Модуль:** academy
**Роль:** USER
**Путь:** `//academy`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //academy | Страница загружается |
| 2 | Выполнить действие: getAcademyArticlesAction | Действие выполняется успешно |
| 3 | Выполнить действие: upsertAcademyArticleAction | Действие выполняется успешно |
| 4 | Выполнить действие: deleteAcademyArticleAction | Действие выполняется успешно |

### JOURNEY-academy---academy-guides-:platform
**Модуль:** academy
**Роль:** USER
**Путь:** `//academy/guides/:platform`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //academy/guides/:platform | Страница загружается |
| 2 | Подготовить данные для параметров: ['platform'] | Данные подготовлены |
| 3 | Выполнить действие: getAcademyArticlesAction | Действие выполняется успешно |
| 4 | Выполнить действие: upsertAcademyArticleAction | Действие выполняется успешно |
| 5 | Выполнить действие: deleteAcademyArticleAction | Действие выполняется успешно |

### JOURNEY-academy---academy-:slug
**Модуль:** academy
**Роль:** USER
**Путь:** `//academy/:slug`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //academy/:slug | Страница загружается |
| 2 | Подготовить данные для параметров: ['slug'] | Данные подготовлены |
| 3 | Выполнить действие: getAcademyArticlesAction | Действие выполняется успешно |
| 4 | Выполнить действие: upsertAcademyArticleAction | Действие выполняется успешно |
| 5 | Выполнить действие: deleteAcademyArticleAction | Действие выполняется успешно |

### JOURNEY-ai-manifest---ai-manifest
**Модуль:** ai-manifest
**Роль:** USER
**Путь:** `//ai-manifest`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //ai-manifest | Страница загружается |

### JOURNEY-cart---cart
**Модуль:** cart
**Роль:** USER
**Путь:** `//cart`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //cart | Страница загружается |

### JOURNEY-catalog---catalog
**Модуль:** catalog
**Роль:** USER
**Путь:** `//catalog`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //catalog | Страница загружается |

### JOURNEY-dashboard---dashboard
**Модуль:** dashboard
**Роль:** USER
**Путь:** `//dashboard`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard | Страница загружается |
| 2 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 3 | Выполнить действие: getPremiumServices | Действие выполняется успешно |

### JOURNEY-dashboard---dashboard-api
**Модуль:** dashboard
**Роль:** SYSTEM
**Путь:** `//dashboard/api`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard/api | Страница загружается |
| 2 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 3 | Выполнить действие: getPremiumServices | Действие выполняется успешно |

### JOURNEY-dashboard---dashboard-orders
**Модуль:** dashboard
**Роль:** USER
**Путь:** `//dashboard/orders`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard/orders | Страница загружается |
| 2 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 3 | Выполнить действие: getPremiumServices | Действие выполняется успешно |

### JOURNEY-dashboard---dashboard-orders-new
**Модуль:** dashboard
**Роль:** USER
**Путь:** `//dashboard/orders/new`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard/orders/new | Страница загружается |
| 2 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 3 | Выполнить действие: getPremiumServices | Действие выполняется успешно |

### JOURNEY-dashboard---dashboard-orders-:id
**Модуль:** dashboard
**Роль:** USER
**Путь:** `//dashboard/orders/:id`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard/orders/:id | Страница загружается |
| 2 | Подготовить данные для параметров: ['id'] | Данные подготовлены |
| 3 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 4 | Выполнить действие: getPremiumServices | Действие выполняется успешно |

### JOURNEY-dashboard---dashboard-premium
**Модуль:** dashboard
**Роль:** USER
**Путь:** `//dashboard/premium`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard/premium | Страница загружается |
| 2 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 3 | Выполнить действие: getPremiumServices | Действие выполняется успешно |

### JOURNEY-dashboard---dashboard-premium-catalog
**Модуль:** dashboard
**Роль:** USER
**Путь:** `//dashboard/premium/catalog`

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Перейти на страницу //dashboard/premium/catalog | Страница загружается |
| 2 | Выполнить действие: analyzePremiumLink | Действие выполняется успешно |
| 3 | Выполнить действие: getPremiumServices | Действие выполняется успешно |
