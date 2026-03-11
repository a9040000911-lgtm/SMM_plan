# Инструкция по командной разработке (GitLab + Docker)

Для команды из 3-х человек на Ubuntu сервере идеальным будет процесс **GitLab Flow**.

## 🏗️ Архитектура системы
1. **Runner**: GitLab Runner (в Docker) будет собирать проект.
2. **Registry**: GitLab Container Registry будет хранить готовые образы.
3. **Production**: Тот же сервер (или другой) будет "тянуть" (pull) образы и запускать их.

---

## 🛠️ Настройка CI/CD (Автоматизация)

В корне проекта нужно создать файл `.gitlab-ci.yml`. Он заставит сервер самого собирать проект при каждом `git push`.

### Пример `.gitlab-ci.yml`:
```yaml
stages:
  - build
  - deploy

build_images:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE/app:latest .
    - docker build -t $CI_REGISTRY_IMAGE/bot:latest --target bot-runner .
    - docker push $CI_REGISTRY_IMAGE/app:latest
    - docker push $CI_REGISTRY_IMAGE/bot:latest
  only:
    - main

deploy_prod:
  stage: deploy
  script:
    - docker compose -f docker-compose.prod.yml pull
    - docker compose -f docker-compose.prod.yml up -d
  only:
    - main
```

---

## 👥 Правила работы в команде (Workflow)

### 1. Ветвление (Branches)
*   **`main`**: Святая ветка. Тот код, который сейчас на сайте. Прямые пуши запрещены.
*   **`develop`**: Ветка для интеграции. Здесь объединяется код всех разработчиков перед релизом.
*   **`feature/имя-задачи`**: Личная ветка разработчика. Создаете её от `develop`, делаете задачу, и создаете **Merge Request** (MR) в GitLab.

### 2. Процесс задачи
1. Разработчик 1: `git checkout develop` -> `git pull` -> `git checkout -b feature/new-logic`.
2. Пишет код, делает `git commit` и `git push origin feature/new-logic`.
3. В GitLab создает **Merge Request** в ветку `develop`.
4. Разработчик 2 или 3 делает **Code Review** (проверяет код) и нажимает "Approve".
5. Код вливается в `develop`.

---

## 🔐 Секреты и .env
Файл `.env` **никогда** не пушится в Git.
*   Для локальной разработки у каждого свой `.env`.
*   Для сервера: добавьте переменные в **GitLab -> Settings -> CI/CD -> Variables**.
*   Или храните один мастер-файл `.env` прямо на сервере в `/opt/smmplan/.env`.

---

---

## 📋 Управление задачами (Agile)

Для команды из 3-х человек мы будем использовать упрощенный **Agile/Scrum**.

### 1. GitLab Issues & Boards
1. **Backlog**: Список всех идей и багов. Любой член команды может добавить туда задачу.
2. **Issues**: Каждая задача — это отдельный "Issue" в GitLab. В описании четко пишем:
    - *Что сделать* (User Story).
    - *Как проверить* (Acceptance Criteria).
3. **Boards (Доски)**: Используйте колонки:
    - `To Do` (Надо сделать).
    - `In Progress` (В работе).
    - `Review` (Проверка кода).
    - `Done` (Готово).

### 2. Разбор и оценка (Planning)
Раз в неделю собирайтесь на 30 минут:
1. Выбирайте задачи из Backlog в колонку `To Do`.
2. Назначайте ответственного (Assignee).
3. Присваивайте вес (Weight) — от 1 до 5 (сложность).

---

## 💎 Гарантия качества (Definition of Done)

Задача считается **выполненной (Done)** только если:
1. Код написан и не содержит ошибок (linting pass).
2. Создан **Merge Request** (MR).
3. Процесс **CI/CD Build** прошел успешно (зеленая галочка).
4. Минимум **один другой разработчик** проверил код (Code Review) и нажал Approve.
5. Изменения проверены на тестовом сервере (или локально).

---

## 👁️ Как делать Code Review (Подтверждение)

Когда вы проверяете чужой код в GitLab:
1. **Логика**: Понятно ли, что делает код? Нет ли в нем лишних циклов или дыр в безопасности?
2. **Стиль**: Соответствует ли код нашим правилам (Tailwind 4, Next.js 16)?
3. **Комментирование**: Если в коде есть сложный кусок — он должен быть прокомментирован.
4. **Конструктивность**: Пишите не "Это плохо", а "Давай попробуем этот метод, он быстрее".

---

## 🚀 Как начать прямо сейчас
1. Установите GitLab в Docker на Ubuntu (через `docker-compose`).
2. Запушьте код из вашей папки `D:\Smmplan` в новый репозиторий GitLab (команду `git push` я помогу составить).
3. Каждому разработчику дайте доступ (**Members** -> **Developer**).
4. Они делают `git clone` и работают по веткам.

**Нужно ли мне помочь составить полный `docker-compose.yml` для запуска самого GitLab на вашем сервере?**
