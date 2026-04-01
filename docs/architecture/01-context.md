# 🏛 Архитектура: Контекст Системы (System Context)

В архитектуре **Smmplan** (построенной на базе концепции C4 Model) контекстный уровень (Layer 1) показывает, как платформа взаимодействует с внешними агентами (пользователями, администраторами) и внешними системами.

## C4 Диаграмма: Контекст (Mermaid.js)

```mermaid
C4Context
    title Информационная система Smmplan (B2B/B2C SaaS)

    Person(customer, "Клиент (B2C/B2B)", "Заказывает подписчиков, лайки, оплачивает услуги")
    Person(admin, "Администратор", "Управляет провайдерами, услугами, ценами и тикетами поддержки")
    
    System(smmplan, "Smmplan Platform", "Ядро SMM-автоматизации (Next.js 16, PostgreSQL). Маршрутизирует заказы, считает Unit-экономику, обрабатывает платежи.")
    
    System_Ext(telegram, "Telegram API", "Интерфейс мессенджера для уведомлений и бота оформления заказов")
    System_Ext(yookassa, "YooKassa (Payment)", "Платежный шлюз эквайринга для приема платежей (Рубли)")
    System_Ext(smm_panel, "Внешние SMM Panels", "Оптовые поставщики услуг (API)")
    System_Ext(cbr, "API ЦБ РФ", "Провайдер актуальных курсов валют (RUB/USD)")

    Rel(customer, smmplan, "Авторизуется, создает заказы, пополняет баланс", "HTTPS/Web")
    Rel(customer, telegram, "Общается с ботом, получает квитанции", "Telegram Protocol")
    
    Rel(admin, smmplan, "Аналитика в Global Treasury, настройка провайдеров", "HTTPS")

    Rel(telegram, smmplan, "Передает Webhook-команды", "HTTPS/JSON")
    Rel(smmplan, telegram, "Отправляет сообщения (уведомления)", "REST API")

    Rel(smmplan, yookassa, "Создает Invoice, проверяет статус", "REST API")
    Rel(yookassa, smmplan, "Webhook: Payment Succeeded", "HTTPS/JSON")

    Rel(smmplan, smm_panel, "Делегирует заказы, проверяет статус выполнения", "REST API")
    Rel(smmplan, cbr, "Получает текущий курс доллара", "XML")
```

## Участники (Actors)

1. **Клиент (Customer):** Конечный пользователь. Заходит через браузер или `Telegram-бот`. Ему важны скорость загрузки, микро-анимации и Trust-сигналы при оплате (см. Neuro-UX Design).
2. **Администратор (Admin):** Управляет бизнесом: подключает провайдеров, меняет наценки (Markup) и обрабатывает тикеты HappinessDesk. 

## Внешние Системы (External Systems)

Сложность Smmplan заключается в его роли "Маршрутизатора" между деньгами (YooKassa/Crypto) и Исполнителями (Оптовые SMM-панели).
Мы никогда не исполняем услуги самостоятельно. Мы — *финансовый кэширующий слой и агрегатор B2B/B2C заявок*.
