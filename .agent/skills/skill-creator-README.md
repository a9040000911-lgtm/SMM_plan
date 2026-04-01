# Skill Creator v2.0 - Руководство по установке и использованию

## Описание

**Skill Creator** — это мета-навык для создания, улучшения и тестирования AI-навыков. Включает:

- 🚀 **CLI для инициализации** — создание навыков одной командой
- ✅ **Система валидации** — проверка структуры и метаданных
- 📊 **Бенчмаркинг** — тестирование с количественными метриками
- 🔍 **Аналитика** — обнаружение аномалий, трендов, регрессий
- 🔄 **CI/CD** — автоматизация через GitHub Actions
- 📦 **Публикация** — интеграция с skills.sh marketplace

---

## Установка

### Способ 1: Ручная установка

```bash
# 1. Распакуйте архив
unzip skill-creator-v2.0.zip -d ~/skills/

# 2. Установите зависимости
pip install pyyaml jsonschema requests

# 3. Проверьте установку
python ~/skills/skill-creator/scripts/quick_validate.py ~/skills/skill-creator
```

### Способ 2: Установка в проект

```bash
# 1. Создайте директорию для навыков
mkdir -p ~/my-project/skills

# 2. Распакуйте
unzip skill-creator-v2.0.zip -d ~/my-project/skills/

# 3. Добавьте в PATH (опционально)
export SKILL_PATH=~/my-project/skills/skill-creator
alias skill-init='python $SKILL_PATH/scripts/init_skill.py'
alias skill-validate='python $SKILL_PATH/scripts/quick_validate.py'
alias skill-package='python $SKILL_PATH/scripts/package_skill.py'
alias skill-publish='python $SKILL_PATH/scripts/publish_skill.py'
```

### Способ 3: Использование в GLM/Claude

Если вы используете GLM или Claude с поддержкой навыков:

```bash
# Распакуйте в директорию навыков системы
unzip skill-creator-v2.0.zip -d ~/.glm/skills/
# или
unzip skill-creator-v2.0.zip -d ~/.claude/skills/
```

---

## Быстрый старт

### 1. Создание нового навыка

```bash
# Базовое создание
python scripts/init_skill.py my-skill --path ./skills

# С полными ресурсами
python scripts/init_skill.py pdf-processor --path ./skills \
    --resources scripts,references,assets \
    --interface display_name="PDF Processor" \
    --interface short_description="Process PDF files" \
    --interface brand_color="#C62828"

# Структура созданного навыка:
# my-skill/
# ├── SKILL.md           # Основной файл с инструкциями
# ├── agents/
# │   └── openai.yaml    # UI метаданные
# ├── scripts/           # Python скрипты
# ├── references/        # Документация
# └── assets/            # Ресурсы (шаблоны, иконки)
```

### 2. Редактирование SKILL.md

```markdown
---
name: my-skill
description: Что делает навык и когда использовать. Добавьте ключевые слова для триггера.
---

# My Skill

## Purpose
Описание назначения навыка.

## Usage
Инструкции по использованию.

## Workflow
1. Шаг 1
2. Шаг 2
3. Шаг 3
```

### 3. Валидация

```bash
# Быстрая проверка
python scripts/quick_validate.py ./skills/my-skill

# Подробный вывод
python scripts/quick_validate.py ./skills/my-skill --verbose
```

### 4. Создание тестов

Создайте файл `evals/evals.json`:

```json
{
  "skill_name": "my-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Тестовый запрос для навыка",
      "expected_output": "Описание ожидаемого результата",
      "assertions": [
        {
          "text": "Результат содержит ключевое слово",
          "check": "contains",
          "value": "success"
        }
      ]
    }
  ]
}
```

### 5. Генерация утверждений

```bash
# Автоматическая генерация утверждений
python scripts/suggest_assertions.py ./skills/my-skill --num 5
```

### 6. Упаковка

```bash
# Создание .skill файла
python scripts/package_skill.py ./skills/my-skill

# Результат: my-skill.skill
```

---

## CLI Команды

### init_skill.py — Создание навыка

```bash
python scripts/init_skill.py <name> --path <directory> [options]

Обязательные аргументы:
  name                  Имя навыка (kebab-case, например "pdf-processor")
  --path PATH           Директория для создания

Опции:
  --resources LIST      Создать директории (scripts,references,assets)
  --examples            Создать примеры тестов
  --interface KEY=VAL   UI метаданные (display_name, short_description, etc.)
  --force               Перезаписать существующий

Примеры:
  python scripts/init_skill.py data-analyzer --path ./skills \
      --resources scripts,references \
      --interface display_name="Data Analyzer" \
      --interface short_description="Analyze data files"

  python scripts/init_skill.py web-scraper --path ./skills \
      --resources scripts,references,assets \
      --examples
```

### quick_validate.py — Валидация

```bash
python scripts/quick_validate.py <skill-path> [options]

Опции:
  --verbose             Подробный вывод
  --json                Вывод в JSON формате

Проверяет:
  ✓ Наличие SKILL.md
  ✓ YAML frontmatter
  ✓ Формат имени (kebab-case)
  ✓ Длина описания (<1024 символов)
  ✓ openai.yaml (если есть)
  ✓ Консистентность имени между файлами
```

### generate_openai_yaml.py — UI метаданные

```bash
python scripts/generate_openai_yaml.py <skill-path> [options]

Опции:
  --interface KEY=VAL   Установить поле
  --tags TAGS           Теги через запятую
  --examples            Генерировать примеры
  --overwrite           Перезаписать существующий
  --dry-run             Показать без записи

Пример:
  python scripts/generate_openai_yaml.py ./skills/my-skill \
      --interface display_name="My Skill" \
      --interface brand_color="#1F4E79" \
      --tags automation,document \
      --overwrite
```

### package_skill.py — Упаковка

```bash
python scripts/package_skill.py <skill-path> [options]

Опции:
  --output PATH         Путь для .skill файла
  --validate            Валидировать перед упаковкой

Пример:
  python scripts/package_skill.py ./skills/my-skill \
      --output ./dist/my-skill.skill \
      --validate
```

### publish_skill.py — Публикация

```bash
python scripts/publish_skill.py <skill-path> [options]

Опции:
  --api-key KEY         API ключ (или SKILLS_SH_API_KEY env)
  --endpoint URL        API endpoint (по умолчанию: https://api.skills.sh)
  --dry-run             Валидация без публикации
  --update              Обновить существующий навык
  --private             Опубликовать как приватный
  --tags TAGS           Переопределить теги

Примеры:
  # Проверка перед публикацией
  python scripts/publish_skill.py ./skills/my-skill --dry-run

  # Публикация
  export SKILLS_SH_API_KEY="your-api-key"
  python scripts/publish_skill.py ./skills/my-skill

  # Обновление
  python scripts/publish_skill.py ./skills/my-skill --update
```

### aggregate_benchmark.py — Аналитика

```bash
python scripts/aggregate_benchmark.py <benchmark-dir> [options]

Опции:
  --skill-name NAME     Имя навыка
  --output PATH         Путь для benchmark.json
  --analytics           Генерировать отчёт с аналитикой
  --trend DIR           Директория с историей для трендов
  --compare FILE        Сравнить с предыдущим benchmark.json

Примеры:
  # Базовая агрегация
  python scripts/aggregate_benchmark.py ./workspace/iteration-1

  # С аналитикой
  python scripts/aggregate_benchmark.py ./workspace/iteration-1 --analytics

  # Анализ трендов
  python scripts/aggregate_benchmark.py ./workspace/iteration-1 \
      --analytics \
      --trend ./benchmarks/

  # Обнаружение регрессий
  python scripts/aggregate_benchmark.py ./workspace/iteration-2 \
      --compare ./workspace/iteration-1/benchmark.json
```

---

## GitHub Actions CI/CD

### Настройка

1. Скопируйте `.github/workflows/skill-ci.yml` в ваш репозиторий

2. Для публикации добавьте секрет:
   - Settings → Secrets → Actions → New repository secret
   - Name: `SKILLS_SH_API_KEY`
   - Value: ваш API ключ

### Автоматические проверки

CI пайплайн запускается при:
- Push в ветки с изменениями в `skills/**`
- Pull Request с изменениями навыков
- Ручной запуск (workflow_dispatch)

### Jobs

| Job | Описание |
|-----|----------|
| validate | Валидация всех навыков |
| test | Тестирование каждого навыка |
| package | Упаковка в .skill файлы (только main) |
| security | Сканирование на секреты и вредоносный код |
| report | Генерация отчёта |

### Ручной запуск конкретного навыка

```bash
# Через GitHub UI: Actions → Skill CI → Run workflow
# Или через CLI:
gh workflow run skill-ci.yml -f skill_path=skills/my-skill
```

---

## Структура навыка

```
my-skill/
├── SKILL.md              # Обязательный: инструкции для AI
│   ├── ---               # YAML frontmatter
│   │   name: my-skill
│   │   description: ...
│   └── ---               # Markdown контент
│
├── agents/               # Опционально: субагенты
│   ├── openai.yaml       # UI метаданные (рекомендуется)
│   ├── grader.md         # Инструкции для оценки
│   └── comparator.md     # Инструкции для сравнения
│
├── scripts/              # Опционально: Python скрипты
│   ├── __init__.py
│   └── main.py           # Основная логика
│
├── references/           # Опционально: документация
│   ├── overview.md
│   └── examples.md
│
├── assets/               # Опционально: ресурсы
│   ├── templates/
│   └── icons/
│
└── evals/                # Опционально: тесты
    └── evals.json        # Тестовые сценарии
```

---

## Лучшие практики

### 1. Именование

```bash
# Хорошо
pdf-extractor
data-analyzer
web-scraper

# Плохо
PdfExtractor
pdf_extractor
PDFExtractor
```

### 2. Описание (description)

```yaml
# Хорошо: конкретно, с ключевыми словами
description: |
  Extract text, tables, and images from PDF files. Use when:
  (1) Extracting content from PDF documents
  (2) Converting PDF to other formats
  (3) Analyzing PDF structure

# Плохо: слишком общее
description: A PDF skill
```

### 3. Размер SKILL.md

- Цель: < 500 строк
- Метаданные ~100 слов
- Тело < 500 строк
- Выносите примеры в `references/examples.md`

### 4. Тестирование

- Минимум 3 тестовых сценария
- Разнообразные утверждения (contains, regex, json_schema)
- Тестируйте edge cases и ошибки

---

## Примеры использования

### Создание навыка для обработки документов

```bash
# 1. Инициализация
python scripts/init_skill.py doc-processor --path ./skills \
    --resources scripts,references,assets \
    --interface display_name="Document Processor" \
    --interface short_description="Process Word and PDF documents" \
    --interface brand_color="#1565C0"

# 2. Редактирование SKILL.md
# Добавьте логику обработки документов

# 3. Создание тестов
mkdir -p ./skills/doc-processor/evals
# Создайте evals.json

# 4. Валидация
python scripts/quick_validate.py ./skills/doc-processor --verbose

# 5. Упаковка
python scripts/package_skill.py ./skills/doc-processor

# 6. Публикация (опционально)
python scripts/publish_skill.py ./skills/doc-processor --dry-run
```

### Создание навыка для анализа данных

```bash
# 1. Инициализация
python scripts/init_skill.py data-insights --path ./skills \
    --resources scripts,references \
    --interface display_name="Data Insights" \
    --interface short_description="Analyze CSV/Excel data and generate insights" \
    --interface brand_color="#2E7D32"

# 2. Добавление скриптов анализа
# Создайте scripts/analyze.py

# 3. Создание примеров
cat > ./skills/data-insights/references/examples.md << 'EOF'
# Examples

## Basic Analysis
Input: "Analyze sales.csv"
Output: Statistical summary + visualizations

## Trend Detection
Input: "Find trends in quarterly_revenue.xlsx"
Output: Trend analysis with predictions
EOF

# 4. Тестирование и упаковка
python scripts/quick_validate.py ./skills/data-insights
python scripts/package_skill.py ./skills/data-insights
```

---

## Решение проблем

### Навык не триггерится

```bash
# Проверьте описание
grep "description:" ./skills/my-skill/SKILL.md

# Убедитесь, что описание содержит ключевые слова
# Пользователи могут использовать: "pdf", "document", "extract"
# Добавьте их в description
```

### Ошибка валидации

```bash
# Запустите с verbose
python scripts/quick_validate.py ./skills/my-skill --verbose

# Частые проблемы:
# - Отсутствует frontmatter
# - Имя не в kebab-case
# - Описание > 1024 символов
# - Несовпадение имени в SKILL.md и openai.yaml
```

### Проблемы с публикацией

```bash
# Проверьте dry-run
python scripts/publish_skill.py ./skills/my-skill --dry-run

# Убедитесь, что API ключ установлен
echo $SKILLS_SH_API_KEY

# Проверьте структуру
python scripts/quick_validate.py ./skills/my-skill --verbose
```

---

## Файловая структура после установки

```
~/skills/skill-creator/
├── SKILL.md                    # Главный файл навыка (311 строк)
├── LICENSE.txt
│
├── agents/
│   ├── openai.yaml             # UI метаданные skill-creator
│   ├── grader.md               # Агент для оценки
│   ├── comparator.md           # Агент для сравнения
│   └── analyzer.md             # Агент для анализа
│
├── scripts/
│   ├── __init__.py
│   ├── init_skill.py           # ★ CLI для создания навыков
│   ├── quick_validate.py       # ★ Валидация
│   ├── generate_openai_yaml.py # ★ Генерация UI метаданных
│   ├── package_skill.py        # ★ Упаковка
│   ├── publish_skill.py        # ★ Публикация
│   ├── aggregate_benchmark.py  # ★ Аналитика
│   ├── suggest_assertions.py   # Генерация утверждений
│   ├── run_eval.py             # Запуск тестов
│   ├── run_loop.py             # Итерации улучшения
│   ├── improve_description.py  # Оптимизация описания
│   ├── generate_report.py      # Генерация отчётов
│   └── utils.py                # Утилиты
│
├── references/
│   ├── openai_yaml.md          # Спецификация openai.yaml
│   ├── composition.md          # ★ Композиция навыков
│   ├── examples.md             # Примеры использования
│   ├── troubleshooting.md      # Решение проблем
│   ├── schemas.md              # JSON схемы
│   ├── assertion_design.md     # Проектирование утверждений
│   ├── evaluation_workflow.md  # Workflow тестирования
│   └── platform_guide.md       # Инструкции по платформам
│
├── eval-viewer/
│   ├── generate_review.py      # Генерация HTML обзора
│   └── viewer.html             # Шаблон обозревателя
│
├── assets/
│   └── eval_review.html        # HTML шаблон
│
└── .github/workflows/
    └── skill-ci.yml            # ★ CI/CD пайплайн
```

---

## Поддержка

- **Документация:** `references/` директория
- **Примеры:** `references/examples.md`
- **Решение проблем:** `references/troubleshooting.md`
- **Композиция:** `references/composition.md`

---

## Версия

**Skill Creator v2.0**
- 9 новых функций
- 4 новых скрипта
- 3 новых reference документа
- GitHub Actions CI/CD
- Интеграция с skills.sh

Создано: 2026-03-26
