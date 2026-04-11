/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export type Locale = 'ru' | 'en';
export type Dictionary = typeof dictionaries.ru;

export const dictionaries = {
    ru: {
        hero: {
            title: "Умное продвижение",
            subtitle: "Автопилот для ваших социальных сетей",
            analyze_btn: "Анализировать",
            analyzing: "Анализ...",
            placeholder: "Вставьте ссылку на профиль или пост..."
        },
        features: {
            direct_access: "Прямой доступ",
            direct_desc: "Собственная сеть узлов распределения трафика.",
            roi_guarantee: "Гарантия ROI",
            roi_desc: "Автоматический контроль за отписками.",
            instant_start: "Мгновенный старт",
            instant_desc: "95% заказов запускаются за 120 секунд.",
            global_info: "Global Инфо",
            global_desc: "Доступ к крупнейшим рекламным сетям мира."
        },
        catalog: {
            available_modules: "ДОСТУПНЫЕ МОДУЛИ",
            select_category: "Выберите категорию для анализа тарифов",
            back: "Назад",
            curated_list: "ПОДБОРКА",
            curated_sub: "Мы отобрали 3 лучших решения для вашей задачи",
            to_categories: "К категориям"
        },
        checkout: {
            title: "Оформление заказа",
            subtitle: "Параметризация и активация протокола",
            to_tariffs: "К списку тарифов",
            selected_node: "ВЫБРАННЫЙ УЗЕЛ",
            platform_exec: "Платформа исполнения:",
            mandatory_req: "ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ",
            email_label: "Email для регистрации",
            link_label: "Ссылка на объект (URL)",
            qty_label: "Количество единиц",
            min: "Минимум",
            max: "Максимум",
            total: "Итого к оплате",
            price_per: "Цена за 1 шт.",
            pay_btn: "ОПЛАТИТЬ",
            activate_btn: "АКТИВИРОВАТЬ ПРОТОКОЛ",
            init_payment: "ИНИЦИАЛИЗАЦИЯ ОПЛАТЫ"
        },
        help: {
            title: "НЕ НАШЛИ ТАРИФ?",
            subtitle: "Возможно, вы ищете тариф под другим названием или вводите неправильный тип ссылки. Раскройте нужную категорию ниже:",
            still_need_help: "Все еще нужна помощь?",
            support_time: "Наша поддержка ответит в течение 30 минут",
            write_btn: "Написать",
            needed: "Нужна:",
            example: "Пример:"
        },
        tma: {
            title: "SMMPLAN MINI APP",
            subtitle: "ПАНЕЛЬ УПРАВЛЕНИЯ",
            balance: "БАЛАНС",
            orders: "ЗАКАЗЫ",
            services: "УСЛУГИ",
            support: "ПОДДЕРЖКА",
            top_up: "ПОПОЛНИТЬ",
            profile: "ПРОФИЛЬ",
            active_orders: "АКТИВНЫЕ ЗАКАЗЫ",
            total_spent: "ВСЕГО ПОТРАЧЕНО",
            discount: "ВАША СКИДКА",
            logout: "ВЫЙТИ",
            analyze_placeholder: "Вставьте ссылку для анализа...",
            analyze_action: "Подобрать спектр услуг",
            found_spectrum: "Найден спектр:",
            reset: "Сброс",
            available: "Доступно",
            system_active: "Система активна",
            system_active_desc: "Безопасное соединение с рекламной инфраструктурой установлено.",
            catalog_title: "Каталог мощностей",
            module_dev: "Модуль в разработке",
            order_link: "Ссылка",
            order_qty: "Количество",
            min: "Мин",
            max: "Макс",
            cancel: "Отмена",
            order_btn: "Заказать",
            attention: "Внимание",
            console: "Консоль",
            mass: "Опт",
            history: "История",
            help_nav: "Помощь",
            terminal_access: "Доступ к терминалу",
            catalog_menu: "Каталог"
        },
        admin: {
            loyalty: {
                builder_title: "Конструктор Лояльности",
                builder_subtitle: "Управляйте уровнями, промокодами и автоматическими наградами.",
                stats_turnover: "Общий оборот",
                stats_clients: "Всего клиентов",
                stats_bonuses: "Выдано бонусов",
                stats_rules: "Активных правил",
                tiers_title: "Уровни лояльности",
                tiers_subtitle: "Скидки, которые получают пользователи за объем трат.",
                tier_name: "Название уровня",
                tier_min: "Траты (₽)",
                tier_discount: "Скидка (%)",
                automation_title: "Конструктор автоматизаций",
                automation_subtitle: "Автоматическая выдача бонусов и промокодов.",
                rule_trigger: "Триггер (Когда?)",
                rule_condition: "Условие (Сколько?)",
                rule_reward: "Награда (Что?)",
                rule_value: "Значение награды",
                rule_placeholder: "Название правила...",
                triggers: {
                    REGISTRATION: "Регистрация",
                    DEPOSIT_GTE: "Пополнение >=",
                    SPEND_GTE: "Траты >=",
                    ORDER_COUNT_GTE: "Кол-во заказов >="
                },
                rewards: {
                    PROMO_ISSUE: "Выдать промокод (%)",
                    BALANCE_ADD: "Начислить баланс (₽)"
                },
                save: "Сохранить конфигурацию",
                save_desc: "Все изменения вступят в силу мгновенно для всех проектов.",
                apply: "Применить"
            },
            projects: {
                loyalty_scheme: "Схема лояльности",
                loyalty_desc: "Выберите, как пользователи будут вознаграждаться за траты.",
                classic: "Классические уровни",
                classic_desc: "Стандартная прогрессия Бронза/Серебро/Золото. Знакомо и эффективно для B2B.",
                gamified: "Геймифицированный XP",
                gamified_desc: "Уровни 1-50 в стиле RPG. Микро-награды за каждую покупку. Высокий retention.",
                vip: "VIP Клуб",
                vip_desc: "Логика закрытого клуба. Высокий порог входа, но максимальные привилегии.",
                mechanics: "Механика",
                rules: "Правила",
                rewards: "Награды",
                xp_formula: "XP = Траты / 10",
                level_threshold: "Уровень за 1000 ₽",
                level_discount: "+0.2% Скидка / Уровень",
                vip_entry: "Вход: 50,000 ₽",
                vip_discount: "СКИДКА: 15%",
                vip_below: "Ниже порога: 0%",
                saving: "Сохранение...",
                saved: "Сохранено",
                save_config: "Сохранить схему"
            },
            sidebar: {
                dashboard: "Панель управления",
                orders: "Заказы",
                scheduled: "Расписание (Авто)",
                services: "Каталог услуг",
                categories: "Категории",
                providers: "Провайдеры (API)",
                users: "Пользователи",
                support: "Тикеты (Поддержка)",
                finance: "Финансы",
                marketing: "Маркетинг и Контент",
                promocodes: "Промокоды",
                employees: "Сотрудники",
                logs: "Журнал действий",
                security: "Аудит и Безопасность",
                projects: "Платформы / Проекты",
                advocacy: "NPS и Опросы",
                settings: "Настройки",
                bug_reports: "Баги",
                transactions: "Транзакции",
                expenses: "Расходы",
                title: "Админ",
                subtitle: "Управление платформой",
                roles: {
                    ADMIN: "Супер-админ",
                    SUPPORT: "Поддержка",
                    SEO: "SEO-менеджер",
                    USER: "Пользователь"
                },
                pioneer: "Пионер",
                tariffs: "Тарифы",
                knowledge_base: "База Знаний",
                nav_sections: {
                    management: "Управление",
                    showcase: "Витрина",
                    marketing: "Маркетинг",
                    finance: "Финансы",
                    support: "Поддержка",
                    system: "Система"
                }
            },
            settings: {
                title: "Настройки проекта",
                subtitle: "Выберите проект для конфигурации",
                tabs: {
                    config: "Конфигурация",
                    projects: "Проекты",
                    tiers: "Тарифы",
                    logs: "Журнал (Логи)"
                },
                project_not_found: "Проекты не найдены в БД. Пожалуйста, запустите сид.",
                tiers_ui: {
                    title: "Шаблоны тарифов",
                    subtitle: "Управление качеством и приоритетностью тарифов",
                    global_badge: "Глобальный",
                    add_btn: "Мастер тарифов",
                    name_label: "Название тарифа",
                    name_placeholder: "Например: Эконом",
                    priority_label: "Приоритет (1-10)",
                    priority_tag: "Приоритет",
                    color_label: "Цвет индикатора",
                    create_btn: "Создать тариф",
                    cancel_btn: "Отмена",
                    saving: "Сохранение...",
                    empty_state: "Тарифы не найдены",
                    empty_sub: "Создайте свой первый тариф через мастер",
                    delete_confirm: "Вы уверены? Это может затронуть привязанные услуги.",
                    wizard: {
                        step_context: "Контекст",
                        step_details: "Детали",
                        step_ai: "Описание и ИИ",
                        step_tech: "Тех. данные",
                        platform_label: "Выберите платформу",
                        category_label: "Выберите категорию",
                        desc_label: "Описание (для клиента)",
                        req_label: "Требования к заказу",
                        ai_gen_btn: "Сгенерировать через ИИ",
                        target_type_label: "Тип целевой ссылки",
                        target_type_hint: "Определяет, что пользователь должен вставить (пост, канал, профиль)",
                        finish_btn: "Завершить и сохранить"
                    }
                }
            },
            content: {
                title: "Контент и Маркетинг",
                subtitle: "Управление новостями, программой лояльности и документами.",
                tabs: {
                    news: "Новости",
                    loyalty: "Лояльность",
                    legal: "Документы",
                    reviews: "Отзывы"
                }
            },
            news: {
                title: "Новости и Рассылки",
                subtitle: "Создавайте черновики объявлений и отправляйте их всем пользователям Telegram.",
                create_btn: "Создать объявление",
                stats: {
                    total: "Всего новостей",
                    sent: "Отправлено",
                    drafts: "Черновики"
                },
                table: {
                    content: "Контент",
                    status: "Статус",
                    date: "Дата создания",
                    actions: {
                        send: "Разослать сейчас",
                        edit: "Редактировать"
                    }
                },
                status: {
                    sent: "Отправлено",
                    draft: "Черновик"
                }
            },
            reviews: {
                stats: {
                    pending: "Ожидают модерации",
                    approved: "Опубликовано",
                    rejected: "Отклонено"
                },
                table: {
                    project_date: "Проект / Дата",
                    user: "Пользователь",
                    order_rating: "Заказ / Оценка",
                    text: "Текст отзыва",
                    status: "Статус",
                    actions: "Действия",
                    empty: "Нет отзывов для отображения",
                    anonymous: "Аноним",
                    no_text: "Без текста"
                }
            },
            nps: {
                title: "NPS Аналитика",
                subtitle: "Оценка лояльности и удовлетворенности клиентов",
                period_30: "Последние 30 дней",
                score_card: "Общий NPS",
                trend_dynamic: "Динамика за месяц",
                no_trend: "Нет данных для тренда",
                types: {
                    promoters: "Промоутеры",
                    passives: "Нейтралы",
                    detractors: "Критики"
                },
                ranges: {
                    promoters: "Оценка 9-10",
                    passives: "Оценка 7-8",
                    detractors: "Оценка 0-6"
                },
                charts: {
                    distribution: "Распределение NPS",
                    trend: "Тренд NPS (30 дней)"
                },
                recent: "Последние отзывы NPS",
                no_comment: "Без комментария",
                empty: "Опросов пока нет",
                error: "Ошибка загрузки данных NPS."
            },
            legal: {
                title: "Юридические документы",
                subtitle: "Управление текстами оферты, условий и политики конфиденциальности для проекта",
                error_projects: "Проекты не найдены."
            },
            legal_ui: {
                list_title: "Список документов",
                create_btn: "Создать документ",
                empty_state: "Документы еще не созданы.",
                draft_badge: "Черновик",
                updated_at: "Обновлено",
                edit_modal: "Редактирование",
                new_modal: "Новый документ",
                modal_subtitle: "Добавление юридической информации в проект",
                form: {
                    presets_label: "Быстрые пресеты текста",
                    title_label: "Заголовок",
                    title_placeholder: "Публичная оферта",
                    slug_label: "Slug (URL)",
                    slug_placeholder: "terms",
                    content_label: "Контент (Поддерживает HTML)",
                    content_placeholder: "Введите текст документа...",
                    publish_label: "Опубликовать сейчас",
                    save_btn: "Сохранить изменения",
                    create_btn: "Создать документ",
                    saving_error: "Ошибка при сохранении"
                }
            }
        }
    },
    en: {
        hero: {
            title: "Smart Promotion",
            subtitle: "Autopilot for your social networks",
            analyze_btn: "Analyze",
            analyzing: "Analyzing...",
            placeholder: "Paste link to profile or post..."
        },
        features: {
            direct_access: "Direct Access",
            direct_desc: "Private traffic distribution network nodes.",
            roi_guarantee: "ROI Guarantee",
            roi_desc: "Automated churn control & monitoring.",
            instant_start: "Instant Start",
            instant_desc: "95% of orders start within 120 seconds.",
            global_info: "Global Info",
            global_desc: "Access to world's largest ad networks."
        },
        catalog: {
            available_modules: "AVAILABLE MODULES",
            select_category: "Select category to analyze tariffs",
            back: "Back",
            curated_list: "CURATED LIST",
            curated_sub: "We selected Top-3 solutions for your task",
            to_categories: "To Categories"
        },
        checkout: {
            title: "Checkout",
            subtitle: "Parameterization and protocol activation",
            to_tariffs: "To Tariffs",
            selected_node: "SELECTED NODE",
            platform_exec: "Execution Platform:",
            mandatory_req: "MANDATORY REQUIREMENTS",
            email_label: "Registration Email",
            link_label: "Target Link (URL)",
            qty_label: "Quantity",
            min: "Minimum",
            max: "Maximum",
            total: "Total to Pay",
            price_per: "Price per 1 item",
            pay_btn: "PAY",
            activate_btn: "ACTIVATE PROTOCOL",
            init_payment: "INITIALIZE PAYMENT"
        },
        help: {
            title: "DIDN'T FIND A SERVICE?",
            subtitle: "Maybe you are looking for a service under a different name or entering the wrong link type. Expand the category below:",
            still_need_help: "Still need help?",
            support_time: "Our support replies within 30 minutes",
            write_btn: "Contact Us",
            needed: "Required:",
            example: "Example:"
        },
        tma: {
            title: "SMMPLAN MINI APP",
            subtitle: "CONTROL PANEL",
            balance: "BALANCE",
            orders: "ORDERS",
            services: "SERVICES",
            support: "SUPPORT",
            top_up: "TOP UP",
            profile: "PROFILE",
            active_orders: "ACTIVE ORDERS",
            total_spent: "TOTAL SPENT",
            discount: "YOUR DISCOUNT",
            logout: "LOGOUT",
            analyze_placeholder: "Paste link to analyze...",
            analyze_action: "Find Service Spectrum",
            found_spectrum: "Spectrum Found:",
            reset: "Reset",
            available: "Available",
            system_active: "System Active",
            system_active_desc: "Secure connection to ad infrastructure established.",
            catalog_title: "Power Catalog",
            module_dev: "Module under development",
            order_link: "Link",
            order_qty: "Quantity",
            min: "Min",
            max: "Max",
            cancel: "Cancel",
            order_btn: "Order",
            attention: "Attention",
            console: "Console",
            mass: "Mass",
            history: "History",
            help_nav: "Help",
            terminal_access: "Terminal Access",
            catalog_menu: "Catalog"
        },
        admin: {
            loyalty: {
                builder_title: "Loyalty Builder",
                builder_subtitle: "Manage tiers, promo codes and automated rewards.",
                stats_turnover: "Total Turnover",
                stats_clients: "Total Clients",
                stats_bonuses: "Bonuses Issued",
                stats_rules: "Active Rules",
                tiers_title: "Loyalty Tiers",
                tiers_subtitle: "Discounts received by users based on spending volume.",
                tier_name: "Tier Name",
                tier_min: "Spending (₽)",
                tier_discount: "Discount (%)",
                automation_title: "Automation Builder",
                automation_subtitle: "Automatic issuance of bonuses and promo codes.",
                rule_trigger: "Trigger (When?)",
                rule_condition: "Condition (How much?)",
                rule_reward: "Reward (What?)",
                rule_value: "Reward Value",
                rule_placeholder: "Rule description...",
                triggers: {
                    REGISTRATION: "Registration",
                    DEPOSIT_GTE: "Deposit >=",
                    SPEND_GTE: "Spending >=",
                    ORDER_COUNT_GTE: "Order count >="
                },
                rewards: {
                    PROMO_ISSUE: "Issue Promocode (%)",
                    BALANCE_ADD: "Add Balance (₽)"
                },
                save: "Save Configuration",
                save_desc: "All changes will take effect instantly for all projects.",
                apply: "Apply"
            },
            projects: {
                loyalty_scheme: "Loyalty Scheme",
                loyalty_desc: "Choose how users are rewarded for spending.",
                classic: "Classic Tiers",
                classic_desc: "Standard Bronze/Silver/Gold progression. Familiar and effective for B2B.",
                gamified: "Gamified XP",
                gamified_desc: "RPG-style Level 1-50. Micro-rewards for every purchase. High retention.",
                vip: "VIP Club",
                vip_desc: "Exclusive club logic. High barrier to entry, but maximum rewards.",
                mechanics: "Mechanics",
                rules: "Rules",
                rewards: "Rewards",
                xp_formula: "XP = Spend / 10",
                level_threshold: "Level per 1000 RUB",
                level_discount: "+0.2% Discount / Level",
                vip_entry: "Entry: 50,000 RUB",
                vip_discount: "DISCOUNT: 15%",
                vip_below: "Below threshold: 0%",
                saving: "Saving...",
                saved: "Saved",
                save_config: "Save Config"
            },
            sidebar: {
                dashboard: "Dashboard",
                orders: "Orders",
                scheduled: "Scheduled Orders",
                services: "Service Catalog",
                categories: "Categories",
                providers: "Providers (API)",
                users: "Users",
                support: "Support Tickets",
                finance: "Finance",
                marketing: "Marketing & Marketing",
                promocodes: "Promocodes",
                employees: "Employees",
                logs: "Action Logs",
                security: "Audit & Security",
                projects: "Platforms / Projects",
                advocacy: "NPS & Surveys",
                settings: "Settings",
                bug_reports: "Bugs",
                transactions: "Transactions",
                expenses: "Expenses",
                title: "Admin",
                subtitle: "Platform Management",
                roles: {
                    ADMIN: "Super Admin",
                    SUPPORT: "Support",
                    SEO: "SEO Manager",
                    USER: "User"
                },
                pioneer: "Pioneer",
                tariffs: "Tariffs",
                knowledge_base: "Knowledge Base",
                nav_sections: {
                    management: "Management",
                    showcase: "Showcase",
                    marketing: "Marketing",
                    finance: "Finance",
                    support: "Support",
                    system: "System"
                }
            },
            settings: {
                title: "Project Settings",
                subtitle: "Select project to configure",
                tabs: {
                    config: "Configuration",
                    projects: "Projects",
                    tiers: "Tariffs",
                    logs: "Action Logs"
                },
                project_not_found: "No projects found in DB. Please run seed.",
                tiers_ui: {
                    title: "Service Tiers",
                    subtitle: "Manage service quality and priority levels",
                    global_badge: "Global",
                    add_btn: "Tariff Wizard",
                    name_label: "Tier Name",
                    name_placeholder: "e.g. Economy",
                    priority_label: "Priority (1-10)",
                    priority_tag: "Priority",
                    color_label: "Indicator Color",
                    create_btn: "Create Tier",
                    cancel_btn: "Cancel",
                    saving: "Saving...",
                    empty_state: "No tiers found",
                    empty_sub: "Create your first tier using the wizard",
                    delete_confirm: "Are you sure? This might affect linked services.",
                    wizard: {
                        step_context: "Context",
                        step_details: "Details",
                        step_ai: "AI & Description",
                        step_tech: "Technical",
                        platform_label: "Select Platform",
                        category_label: "Select Category",
                        desc_label: "Description (Client-facing)",
                        req_label: "Order Requirements",
                        ai_gen_btn: "Generate with AI",
                        target_type_label: "Target Link Type",
                        target_type_hint: "Defines what user should provide (post, channel, profile)",
                        finish_btn: "Finish & Save"
                    }
                }
            },
            content: {
                title: "Content & Marketing",
                subtitle: "Manage news, loyalty programs and documents.",
                tabs: {
                    news: "News",
                    loyalty: "Loyalty",
                    legal: "Documents",
                    reviews: "Reviews"
                }
            },
            news: {
                title: "News & Broadcasts",
                subtitle: "Create draft announcements and send them to all Telegram users.",
                create_btn: "Create Announcement",
                stats: {
                    total: "Total News",
                    sent: "Sent",
                    drafts: "Drafts"
                },
                table: {
                    content: "Content",
                    status: "Status",
                    date: "Creation Date",
                    actions: {
                        send: "Broadcast Now",
                        edit: "Edit"
                    }
                },
                status: {
                    sent: "Sent",
                    draft: "Draft"
                }
            },
            reviews: {
                stats: {
                    pending: "Pending Moderation",
                    approved: "Published",
                    rejected: "Rejected"
                },
                table: {
                    project_date: "Project / Date",
                    user: "User",
                    order_rating: "Order / Rating",
                    text: "Review Text",
                    status: "Status",
                    actions: "Actions",
                    empty: "No reviews to display",
                    anonymous: "Anonymous",
                    no_text: "No text provided"
                }
            },
            nps: {
                title: "NPS Analytics",
                subtitle: "Client loyalty and satisfaction score",
                period_30: "Last 30 Days",
                score_card: "Total NPS",
                trend_dynamic: "Month Dynamic",
                no_trend: "No data for trend",
                types: {
                    promoters: "Promoters",
                    passives: "Passives",
                    detractors: "Detractors"
                },
                ranges: {
                    promoters: "Score 9-10",
                    passives: "Score 7-8",
                    detractors: "Score 0-6"
                },
                charts: {
                    distribution: "NPS Distribution",
                    trend: "NPS Trend (30 Days)"
                },
                recent: "Recent NPS Reviews",
                no_comment: "No comment",
                empty: "No surveys yet",
                error: "Failed to load NPS data."
            },
            legal: {
                title: "Legal Documents",
                subtitle: "Manage terms of service, policies and privacy for project",
                error_projects: "Projects not found."
            },
            legal_ui: {
                list_title: "Document List",
                create_btn: "Create Document",
                empty_state: "No documents created yet.",
                draft_badge: "Draft",
                updated_at: "Updated",
                edit_modal: "Editing",
                new_modal: "New Document",
                modal_subtitle: "Adding legal information to project",
                form: {
                    presets_label: "Quick text presets",
                    title_label: "Title",
                    title_placeholder: "Public Offer",
                    slug_label: "Slug (URL)",
                    slug_placeholder: "terms",
                    content_label: "Content (Supports HTML)",
                    content_placeholder: "Enter document text...",
                    publish_label: "Publish now",
                    save_btn: "Save changes",
                    create_btn: "Create document",
                    saving_error: "Saving error"
                }
            }
        }
    }
};


