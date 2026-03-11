# 🗺️ Навигатор по документации Smmplan

Добро пожаловать в центр управления документацией. Весь процесс разделен на логические этапы для Владельца и Команды.

---

## 🚦 С чего начать? (Для Владельца)

Если вы только получили проект — следуйте этому порядку:

1.  **[00_GENERAL_ROADMAP.md](file:///d:/Smmplan/docs/00_GENERAL_ROADMAP.md)** — Общий план действий. Прочитайте его первым, чтобы понять общую картину.
2.  **[01_LOCAL_DEVELOPMENT.md](file:///d:/Smmplan/docs/setup/01_LOCAL_DEVELOPMENT.md)** — Как запустить проект на своем компьютере для первой проверки.
3.  **[02_PRODUCTION_DEPLOY.md](file:///d:/Smmplan/docs/setup/02_PRODUCTION_DEPLOY.md)** — Перенос готового проекта на сервер Ubuntu.
4.  **[03_GITLAB_INFRASTRUCTURE.md](file:///d:/Smmplan/docs/setup/03_GITLAB_INFRASTRUCTURE.md)** — Развертывание собственной системы GitLab для контроля разработчиков.

---

## 👥 Для команды разработчиков

Когда инфраструктура готова, выдайте команде эти файлы:

1.  **[04_COLLABORATION_FLOW.md](file:///d:/Smmplan/docs/team/04_COLLABORATION_FLOW.md)** — Правила работы в Git (Ветки, Merge Requests).
2.  **[05_TEAM_STRATEGY.md](file:///d:/Smmplan/docs/team/05_TEAM_STRATEGY.md)** — Презентация смыслов и процессов (Почему мы работаем именно так).
3.  **[06_DEVELOPER_HANDBOOK.md](file:///d:/Smmplan/docs/team/06_DEVELOPER_HANDBOOK.md)** — Ежедневная памятка с командами и чек-листами.
4.  **[07_AUTHORS_PROTECTION.md](file:///d:/Smmplan/docs/team/07_AUTHORS_PROTECTION.md)** — План защиты ваших прав и интеллектуальной собственности.

---

## 🛠️ Техническая информация

- **[Dockerfile](file:///d:/Smmplan/Dockerfile)** — Инструкция сборки контейнеров.
- **[docker-compose.prod.yml](file:///d:/Smmplan/docker-compose.prod.yml)** — Конфиг для запуска всего проекта на сервере.
- **[docker-compose.gitlab.yml](file:///d:/Smmplan/docker-compose.gitlab.yml)** — Конфиг для запуска сервера GitLab.

---

> [!TIP]
> Всегда держите эти инструкции под рукой. Если в процессе работы возникают вопросы — Handbook (Шаг 6) ответит на 90% из них.
