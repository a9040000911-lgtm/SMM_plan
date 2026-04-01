#!/usr/bin/env python3
"""
Валидатор путей User Journey.
Проверяет корректность построенных путей и их полноту.

Использование:
    python validate_paths.py --journeys journeys.json --output report.md
    python validate_paths.py --check-all
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


class ValidationLevel(Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class ValidationIssue:
    """Проблема валидации."""
    level: ValidationLevel
    code: str
    message: str
    journey_id: Optional[str] = None
    step: Optional[int] = None
    suggestion: Optional[str] = None


class PathValidator:
    """Валидатор путей пользователя."""

    # Обязательные элементы для каждого пути
    REQUIRED_ELEMENTS = {
        'happy_path': ['steps', 'expected_result', 'preconditions'],
        'error_path': ['error_scenario', 'expected_behavior'],
        'edge_case': ['test_value', 'expected_result']
    }

    # Обязательные переходы статусов заказа
    ORDER_STATUS_TRANSITIONS = {
        'PENDING': ['IN_PROGRESS', 'CANCELLED', 'FAILED'],
        'IN_PROGRESS': ['COMPLETED', 'PARTIAL', 'CANCELLED', 'FAILED'],
        'COMPLETED': ['REFUND'],
        'FAILED': ['PENDING'],
        'PARTIAL': ['COMPLETED', 'REFUND'],
        'CANCELLED': [],
        'REFUND': []
    }

    def __init__(self, journeys_path: Optional[str] = None):
        self.journeys_path = journeys_path
        self.journeys: List[Dict] = []
        self.issues: List[ValidationIssue] = []

    def load_journeys(self, path: str):
        """Загружает journeys из JSON файла."""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.journeys = data.get('journeys', data.get('user_journeys', []))
        return self.journeys

    def validate_all(self) -> List[ValidationIssue]:
        """Выполняет все проверки."""
        self.issues = []

        if not self.journeys:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                code="NO_JOURNEYS",
                message="Нет загруженных journeys для валидации"
            ))
            return self.issues

        for journey in self.journeys:
            self._validate_journey(journey)

        self._check_coverage()
        self._check_consistency()

        return self.issues

    def _validate_journey(self, journey: Dict):
        """Валидирует отдельный journey."""
        journey_id = journey.get('id', 'unknown')

        # Проверка обязательных полей
        if not journey.get('name'):
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                code="MISSING_NAME",
                message=f"Journey {journey_id}: отсутствует name",
                journey_id=journey_id
            ))

        if not journey.get('role'):
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                code="MISSING_ROLE",
                message=f"Journey {journey_id}: не указана роль",
                journey_id=journey_id
            ))

        # Проверка шагов
        steps = journey.get('steps', [])
        if not steps:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                code="NO_STEPS",
                message=f"Journey {journey_id}: нет шагов",
                journey_id=journey_id
            ))
        else:
            self._validate_steps(journey_id, steps)

    def _validate_steps(self, journey_id: str, steps: List[Dict]):
        """Валидирует шаги."""
        prev_step = 0

        for i, step in enumerate(steps):
            step_num = step.get('step', i + 1)

            # Проверка порядка шагов
            if step_num != prev_step + 1:
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    code="STEP_ORDER",
                    message=f"Journey {journey_id}: нарушение порядка шагов ({prev_step} → {step_num})",
                    journey_id=journey_id,
                    step=step_num
                ))

            prev_step = step_num

            # Проверка обязательных полей шага
            if not step.get('action'):
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    code="MISSING_ACTION",
                    message=f"Journey {journey_id}, шаг {step_num}: нет action",
                    journey_id=journey_id,
                    step=step_num
                ))

            if not step.get('expected'):
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.INFO,
                    code="MISSING_EXPECTED",
                    message=f"Journey {journey_id}, шаг {step_num}: нет expected",
                    journey_id=journey_id,
                    step=step_num,
                    suggestion="Добавьте ожидаемый результат"
                ))

    def _check_coverage(self):
        """Проверяет покрытие по ролям и модулям."""
        roles_found = set()
        modules_found = set()

        for journey in self.journeys:
            if journey.get('role'):
                roles_found.add(journey['role'])
            if journey.get('module'):
                modules_found.add(journey['module'])

        expected_roles = {'USER', 'ADMIN', 'SUPERADMIN', 'SUPPORT'}
        missing_roles = expected_roles - roles_found

        if missing_roles:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                code="INCOMPLETE_ROLE_COVERAGE",
                message=f"Отсутствуют journeys для ролей: {missing_roles}",
                suggestion="Добавьте сценарии для недостающих ролей"
            ))

        expected_modules = {'auth', 'orders', 'finance', 'services', 'admin'}
        missing_modules = expected_modules - modules_found

        if missing_modules:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                code="INCOMPLETE_MODULE_COVERAGE",
                message=f"Отсутствуют journeys для модулей: {missing_modules}",
                suggestion="Рассмотрите добавление сценариев"
            ))

    def _check_consistency(self):
        """Проверяет консистентность данных."""
        # Проверка дубликатов ID
        ids = [j.get('id') for j in self.journeys if j.get('id')]
        duplicates = [id for id in set(ids) if ids.count(id) > 1]

        if duplicates:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                code="DUPLICATE_IDS",
                message=f"Дублирующиеся ID journeys: {duplicates}"
            ))

    def generate_report(self) -> str:
        """Генерирует отчёт в Markdown."""
        lines = [
            "# Отчёт валидации User Journeys",
            "",
            f"**Дата:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"**Всего journeys:** {len(self.journeys)}",
            "",
            "## Сводка",
            "",
        ]

        errors = [i for i in self.issues if i.level == ValidationLevel.ERROR]
        warnings = [i for i in self.issues if i.level == ValidationLevel.WARNING]
        infos = [i for i in self.issues if i.level == ValidationLevel.INFO]

        lines.append(f"- ❌ Ошибки: **{len(errors)}**")
        lines.append(f"- ⚠️ Предупреждения: **{len(warnings)}**")
        lines.append(f"- ℹ️ Рекомендации: **{len(infos)}**")
        lines.append("")

        if errors:
            lines.append("## ❌ Ошибки")
            lines.append("")
            for issue in errors:
                lines.append(f"### {issue.code}")
                lines.append(f"- **Сообщение:** {issue.message}")
                if issue.journey_id:
                    lines.append(f"- **Journey:** {issue.journey_id}")
                if issue.step:
                    lines.append(f"- **Шаг:** {issue.step}")
                lines.append("")

        if warnings:
            lines.append("## ⚠️ Предупреждения")
            lines.append("")
            for issue in warnings:
                lines.append(f"- **[{issue.code}]** {issue.message}")
            lines.append("")

        if infos:
            lines.append("## ℹ️ Рекомендации")
            lines.append("")
            for issue in infos:
                lines.append(f"- {issue.message}")
                if issue.suggestion:
                    lines.append(f"  - 💡 {issue.suggestion}")
            lines.append("")

        return "\n".join(lines)

    def print_summary(self):
        """Выводит сводку в консоль."""
        errors = sum(1 for i in self.issues if i.level == ValidationLevel.ERROR)
        warnings = sum(1 for i in self.issues if i.level == ValidationLevel.WARNING)
        infos = sum(1 for i in self.issues if i.level == ValidationLevel.INFO)

        print("\n" + "="*60)
        print("📊 РЕЗУЛЬТАТ ВАЛИДАЦИИ ПУТЕЙ")
        print("="*60)
        print(f"Всего journeys: {len(self.journeys)}")
        print("-"*60)
        print(f"❌ Ошибки: {errors}")
        print(f"⚠️  Предупреждения: {warnings}")
        print(f"ℹ️  Рекомендации: {infos}")
        print("="*60)

        if errors == 0:
            print("✅ Валидация пройдена успешно!")
            return 0
        else:
            print("❌ Найдены критические ошибки")
            return 1


def main():
    parser = argparse.ArgumentParser(
        description='Валидатор путей User Journey'
    )
    parser.add_argument('--journeys', '-j', help='Путь к файлу journeys.json')
    parser.add_argument('--output', '-o', help='Путь для сохранения отчёта')
    parser.add_argument('--check-all', action='store_true',
                        help='Проверить все стандартные проверки')

    args = parser.parse_args()

    validator = PathValidator()

    if args.journeys:
        if not os.path.exists(args.journeys):
            print(f"❌ Файл не найден: {args.journeys}")
            return 1

        validator.load_journeys(args.journeys)

    validator.validate_all()
    exit_code = validator.print_summary()

    if args.output:
        report = validator.generate_report()
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\n📄 Отчёт сохранён: {args.output}")

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
