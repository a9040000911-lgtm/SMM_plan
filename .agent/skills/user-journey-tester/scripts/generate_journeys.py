#!/usr/bin/env python3
"""
Генератор тест-кейсов для User Journey тестирования.
Создаёт структурированные тест-кейсы на основе конфигурации приложения.

Использование:
    python generate_journeys.py --config config.json --output tests/
    python generate_journeys.py --app smm-panel --role USER --output ./
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from enum import Enum


class Priority(Enum):
    CRITICAL = "P0"
    HIGH = "P1"
    MEDIUM = "P2"
    LOW = "P3"


class TestCaseType(Enum):
    HAPPY_PATH = "happy_path"
    ERROR_PATH = "error_path"
    EDGE_CASE = "edge_case"
    SECURITY = "security"
    PERFORMANCE = "performance"


@dataclass
class TestCase:
    """Модель тест-кейса."""
    id: str
    name: str
    type: TestCaseType
    priority: Priority
    role: str
    module: str
    journey: str
    steps: List[Dict[str, Any]]
    expected_result: str
    preconditions: List[str] = field(default_factory=list)
    test_data: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)


class JourneyGenerator:
    """Генератор тест-кейсов для user journeys."""

    # Конфигурация SMM-панели по умолчанию
    DEFAULT_CONFIG = {
        "app_name": "SMM Panel",
        "roles": ["USER", "ADMIN", "SUPERADMIN", "SUPPORT"],
        "modules": {
            "auth": {
                "name": "Авторизация",
                "actions": ["register", "login", "logout", "reset_password"],
                "entities": ["User"]
            },
            "orders": {
                "name": "Заказы",
                "actions": ["create", "cancel", "repeat", "list", "view"],
                "entities": ["Order", "OrderItem"],
                "statuses": ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FAILED", "PARTIAL", "REFUND"]
            },
            "finance": {
                "name": "Финансы",
                "actions": ["deposit", "withdraw", "history", "convert"],
                "entities": ["Transaction", "Balance"]
            },
            "services": {
                "name": "Услуги",
                "actions": ["list", "view", "create", "update", "delete"],
                "entities": ["Service", "Category", "Provider"]
            },
            "loyalty": {
                "name": "Лояльность",
                "actions": ["referral_link", "referrals", "achievements", "bonus"],
                "entities": ["Referral", "Achievement", "Bonus"]
            },
            "admin": {
                "name": "Админ-панель",
                "actions": ["users", "orders", "services", "finance", "settings"],
                "entities": ["User", "Order", "Service", "Transaction"]
            }
        },
        "status_transitions": {
            "Order": {
                "PENDING": ["IN_PROGRESS", "CANCELLED", "FAILED"],
                "IN_PROGRESS": ["COMPLETED", "PARTIAL", "CANCELLED"],
                "COMPLETED": ["REFUND"],
                "CANCELLED": [],
                "FAILED": ["PENDING"],
                "PARTIAL": ["COMPLETED", "REFUND"],
                "REFUND": []
            }
        }
    }

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self.DEFAULT_CONFIG
        self.test_cases: List[TestCase] = []
        self.counter = 0

    def _generate_id(self, prefix: str = "TC") -> str:
        """Генерирует уникальный ID тест-кейса."""
        self.counter += 1
        return f"{prefix}-{self.counter:04d}"

    def generate_all(self) -> List[TestCase]:
        """Генерирует все тест-кейсы."""
        for module_key, module_config in self.config["modules"].items():
            for role in self.config["roles"]:
                self._generate_module_tests(role, module_key, module_config)
        
        return self.test_cases

    def _generate_module_tests(self, role: str, module_key: str, module_config: Dict):
        """Генерирует тесты для модуля и роли."""
        module_name = module_config["name"]
        actions = module_config.get("actions", [])

        for action in actions:
            # Happy Path
            self._generate_happy_path(role, module_key, module_name, action, module_config)
            
            # Error Paths
            self._generate_error_paths(role, module_key, module_name, action, module_config)
            
            # Edge Cases
            self._generate_edge_cases(role, module_key, module_name, action, module_config)

    def _generate_happy_path(self, role: str, module_key: str, module_name: str, 
                             action: str, module_config: Dict):
        """Генерирует happy path тест-кейс."""
        steps = self._build_happy_path_steps(role, module_key, action, module_config)
        
        tc = TestCase(
            id=self._generate_id(),
            name=f"[{role}] {module_name}: {action} - Happy Path",
            type=TestCaseType.HAPPY_PATH,
            priority=Priority.HIGH,
            role=role,
            module=module_key,
            journey=f"{role.lower()}-{module_key}-{action}",
            steps=steps,
            expected_result=f"Успешное выполнение: {action}",
            preconditions=self._get_preconditions(role, module_key, action),
            test_data=self._get_test_data(module_key, action),
            tags=["happy-path", module_key, role.lower()]
        )
        self.test_cases.append(tc)

    def _generate_error_paths(self, role: str, module_key: str, module_name: str,
                               action: str, module_config: Dict):
        """Генерирует error path тест-кейсы."""
        error_scenarios = self._get_error_scenarios(module_key, action)
        
        for scenario in error_scenarios:
            tc = TestCase(
                id=self._generate_id(),
                name=f"[{role}] {module_name}: {action} - {scenario['name']}",
                type=TestCaseType.ERROR_PATH,
                priority=scenario.get("priority", Priority.MEDIUM),
                role=role,
                module=module_key,
                journey=f"{role.lower()}-{module_key}-{action}-error",
                steps=self._build_error_steps(role, module_key, action, scenario),
                expected_result=scenario["expected"],
                preconditions=self._get_preconditions(role, module_key, action),
                test_data=scenario.get("test_data", {}),
                tags=["error-path", module_key, role.lower(), scenario["name"].lower().replace(" ", "-")]
            )
            self.test_cases.append(tc)

    def _generate_edge_cases(self, role: str, module_key: str, module_name: str,
                              action: str, module_config: Dict):
        """Генерирует edge case тест-кейсы."""
        edge_cases = self._get_edge_cases(module_key, action)
        
        for case in edge_cases:
            tc = TestCase(
                id=self._generate_id(),
                name=f"[{role}] {module_name}: {action} - Edge: {case['name']}",
                type=TestCaseType.EDGE_CASE,
                priority=Priority.LOW,
                role=role,
                module=module_key,
                journey=f"{role.lower()}-{module_key}-{action}-edge",
                steps=self._build_edge_steps(role, module_key, action, case),
                expected_result=case["expected"],
                preconditions=self._get_preconditions(role, module_key, action),
                test_data=case.get("test_data", {}),
                tags=["edge-case", module_key, role.lower()]
            )
            self.test_cases.append(tc)

    def _build_happy_path_steps(self, role: str, module_key: str, action: str, 
                                  module_config: Dict) -> List[Dict]:
        """Строит шаги для happy path."""
        # Базовые шаги по модулям
        step_templates = {
            "orders": {
                "create": [
                    {"step": 1, "action": "Авторизоваться в системе", "expected": "Успешная авторизация"},
                    {"step": 2, "action": "Перейти в каталог услуг", "expected": "Список услуг загружен"},
                    {"step": 3, "action": "Выбрать услугу", "expected": "Форма заказа открыта"},
                    {"step": 4, "action": "Ввести валидную ссылку", "expected": "Ссылка принята"},
                    {"step": 5, "action": "Ввести количество", "expected": "Стоимость рассчитана"},
                    {"step": 6, "action": "Нажать 'Создать заказ'", "expected": "Заказ создан, баланс списан"},
                ],
                "list": [
                    {"step": 1, "action": "Авторизоваться в системе", "expected": "Успешная авторизация"},
                    {"step": 2, "action": "Перейти в 'Мои заказы'", "expected": "Список заказов загружен"},
                ],
                "cancel": [
                    {"step": 1, "action": "Авторизоваться в системе", "expected": "Успешная авторизация"},
                    {"step": 2, "action": "Открыть активный заказ", "expected": "Страница заказа открыта"},
                    {"step": 3, "action": "Нажать 'Отменить'", "expected": "Заказ отменён, частичный возврат"},
                ]
            },
            "auth": {
                "login": [
                    {"step": 1, "action": "Открыть страницу входа", "expected": "Форма загружена"},
                    {"step": 2, "action": "Ввести email", "expected": "Email принят"},
                    {"step": 3, "action": "Ввести пароль", "expected": "Пароль принят"},
                    {"step": 4, "action": "Нажать 'Войти'", "expected": "Успешный вход, редирект"},
                ],
                "register": [
                    {"step": 1, "action": "Открыть страницу регистрации", "expected": "Форма загружена"},
                    {"step": 2, "action": "Ввести email", "expected": "Email валиден"},
                    {"step": 3, "action": "Ввести пароль", "expected": "Пароль соответствует требованиям"},
                    {"step": 4, "action": "Нажать 'Зарегистрироваться'", "expected": "Аккаунт создан, email отправлен"},
                ]
            },
            "finance": {
                "deposit": [
                    {"step": 1, "action": "Авторизоваться в системе", "expected": "Успешная авторизация"},
                    {"step": 2, "action": "Перейти в 'Баланс'", "expected": "Страница баланса открыта"},
                    {"step": 3, "action": "Нажать 'Пополнить'", "expected": "Форма пополнения открыта"},
                    {"step": 4, "action": "Выбрать способ оплаты", "expected": "Способ выбран"},
                    {"step": 5, "action": "Ввести сумму", "expected": "Сумма валидна"},
                    {"step": 6, "action": "Оплатить", "expected": "Редирект на платёжный шлюз"},
                    {"step": 7, "action": "Завершить оплату", "expected": "Баланс пополнен"},
                ]
            }
        }

        # Возвращаем шаблон или базовый шаг
        module_steps = step_templates.get(module_key, {})
        action_steps = module_steps.get(action, [
            {"step": 1, "action": f"Выполнить: {action}", "expected": "Успешное выполнение"}
        ])
        
        return action_steps

    def _get_error_scenarios(self, module_key: str, action: str) -> List[Dict]:
        """Возвращает сценарии ошибок для действия."""
        scenarios = {
            "orders": {
                "create": [
                    {"name": "Недостаточно средств", "expected": "Ошибка: пополните баланс", "priority": Priority.CRITICAL},
                    {"name": "Невалидная ссылка", "expected": "Ошибка валидации ссылки", "priority": Priority.HIGH},
                    {"name": "Приватный профиль", "expected": "Ошибка: профиль должен быть открыт", "priority": Priority.MEDIUM},
                    {"name": "Превышен лимит", "expected": "Ошибка: превышен максимум/минимум", "priority": Priority.LOW},
                ]
            },
            "auth": {
                "login": [
                    {"name": "Неверный пароль", "expected": "Ошибка: неверные учётные данные", "priority": Priority.HIGH},
                    {"name": "Несуществующий email", "expected": "Ошибка: пользователь не найден", "priority": Priority.HIGH},
                    {"name": "Заблокированный аккаунт", "expected": "Ошибка: аккаунт заблокирован", "priority": Priority.HIGH},
                ],
                "register": [
                    {"name": "Существующий email", "expected": "Ошибка: email уже зарегистрирован", "priority": Priority.HIGH},
                    {"name": "Слабый пароль", "expected": "Ошибка: пароль не соответствует требованиям", "priority": Priority.MEDIUM},
                ]
            },
            "finance": {
                "deposit": [
                    {"name": "Платёж отклонён", "expected": "Ошибка оплаты, попробуйте другой способ", "priority": Priority.HIGH},
                    {"name": "Сумма ниже минимума", "expected": "Ошибка: минимальная сумма X", "priority": Priority.MEDIUM},
                ]
            }
        }

        module_scenarios = scenarios.get(module_key, {})
        return module_scenarios.get(action, [])

    def _get_edge_cases(self, module_key: str, action: str) -> List[Dict]:
        """Возвращает edge cases для действия."""
        cases = {
            "orders": {
                "create": [
                    {"name": "Минимальное количество", "expected": "Заказ создаётся", "test_data": {"quantity": "min"}},
                    {"name": "Максимальное количество", "expected": "Заказ создаётся", "test_data": {"quantity": "max"}},
                    {"name": "Граничное (min-1)", "expected": "Ошибка валидации", "test_data": {"quantity": "min-1"}},
                    {"name": "Unicode в ссылке", "expected": "Корректная обработка", "test_data": {"link": "https://x.com/пользователь"}},
                ]
            },
            "auth": {
                "register": [
                    {"name": "Пробелы в email", "expected": "Trim и принятие", "test_data": {"email": " user@email.com "}},
                    {"name": "Unicode в email", "expected": "Корректная обработка", "test_data": {"email": "пользователь@почта.рф"}},
                ]
            }
        }

        module_cases = cases.get(module_key, {})
        return module_cases.get(action, [
            {"name": "Пустые данные", "expected": "Ошибка валидации", "test_data": {}}
        ])

    def _build_error_steps(self, role: str, module_key: str, action: str, 
                           scenario: Dict) -> List[Dict]:
        """Строит шаги для error path."""
        base_steps = self._build_happy_path_steps(role, module_key, action, {})
        
        # Добавляем шаг с ошибкой
        error_step = {
            "step": len(base_steps) + 1,
            "action": f"Сценарий: {scenario['name']}",
            "expected": scenario["expected"],
            "is_error": True
        }
        
        return base_steps[:3] + [error_step]  # Укороченная версия для ошибок

    def _build_edge_steps(self, role: str, module_key: str, action: str, 
                          case: Dict) -> List[Dict]:
        """Строит шаги для edge case."""
        return [
            {"step": 1, "action": f"Подготовить данные: {case.get('test_data', {})}", "expected": "Данные готовы"},
            {"step": 2, "action": f"Выполнить: {action}", "expected": case["expected"]},
        ]

    def _get_preconditions(self, role: str, module_key: str, action: str) -> List[str]:
        """Возвращает предусловия для теста."""
        preconditions = {
            "orders": ["Пользователь авторизован", "Баланс > 0"],
            "finance": ["Пользователь авторизован"],
            "admin": [f"Пользователь имеет роль {role}", "Назначен на проект"],
        }
        return preconditions.get(module_key, ["Пользователь авторизован"])

    def _get_test_data(self, module_key: str, action: str) -> Dict:
        """Возвращает тестовые данные для действия."""
        return {
            "timestamp": datetime.now().isoformat(),
            "module": module_key,
            "action": action
        }

    def export_json(self, output_path: str):
        """Экспортирует тест-кейсы в JSON."""
        data = {
            "generated_at": datetime.now().isoformat(),
            "total_cases": len(self.test_cases),
            "test_cases": [asdict(tc) for tc in self.test_cases]
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        return output_path

    def export_markdown(self, output_path: str):
        """Экспортирует тест-кейсы в Markdown."""
        lines = [
            f"# Сгенерированные тест-кейсы",
            f"",
            f"**Дата генерации:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"**Всего тест-кейсов:** {len(self.test_cases)}",
            f"",
        ]

        # Группируем по ролям
        by_role = {}
        for tc in self.test_cases:
            if tc.role not in by_role:
                by_role[tc.role] = []
            by_role[tc.role].append(tc)

        for role, cases in by_role.items():
            lines.append(f"## Роль: {role}")
            lines.append("")
            lines.append("| ID | Название | Тип | Приоритет | Модуль |")
            lines.append("|---|---|---|---|---|")
            
            for tc in cases:
                lines.append(f"| {tc.id} | {tc.name} | {tc.type.value} | {tc.priority.value} | {tc.module} |")
            
            lines.append("")

        # Детальные тест-кейсы
        lines.append("---")
        lines.append("")
        lines.append("## Детали тест-кейсов")
        lines.append("")

        for tc in self.test_cases:
            lines.append(f"### {tc.id}: {tc.name}")
            lines.append("")
            lines.append(f"- **Тип:** {tc.type.value}")
            lines.append(f"- **Приоритет:** {tc.priority.value}")
            lines.append(f"- **Роль:** {tc.role}")
            lines.append(f"- **Модуль:** {tc.module}")
            lines.append("")
            lines.append("**Предусловия:**")
            for pre in tc.preconditions:
                lines.append(f"- {pre}")
            lines.append("")
            lines.append("**Шаги:**")
            lines.append("")
            lines.append("| Шаг | Действие | Ожидаемый результат |")
            lines.append("|---|---|---|")
            for step in tc.steps:
                lines.append(f"| {step.get('step', '-')} | {step.get('action', '-')} | {step.get('expected', '-')} |")
            lines.append("")
            lines.append(f"**Ожидаемый результат:** {tc.expected_result}")
            lines.append("")

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))

        return output_path

    def print_summary(self):
        """Выводит сводку в консоль."""
        print("\n" + "="*60)
        print("📊 СВОДКА СГЕНЕРИРОВАННЫХ ТЕСТ-КЕЙСОВ")
        print("="*60)
        print(f"Всего: {len(self.test_cases)}")
        print()

        # По типам
        by_type = {}
        for tc in self.test_cases:
            t = tc.type.value
            by_type[t] = by_type.get(t, 0) + 1

        print("По типам:")
        for t, count in by_type.items():
            print(f"  • {t}: {count}")

        # По ролям
        by_role = {}
        for tc in self.test_cases:
            by_role[tc.role] = by_role.get(tc.role, 0) + 1

        print("\nПо ролям:")
        for role, count in by_role.items():
            print(f"  • {role}: {count}")

        print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description='Генератор тест-кейсов для User Journey тестирования'
    )
    parser.add_argument('--config', '-c', help='Путь к конфигурации JSON')
    parser.add_argument('--app', '-a', default='smm-panel', help='Тип приложения')
    parser.add_argument('--role', '-r', help='Фильтр по роли')
    parser.add_argument('--output', '-o', default='.', help='Директория для вывода')
    parser.add_argument('--format', '-f', choices=['json', 'markdown', 'both'], 
                        default='both', help='Формат вывода')

    args = parser.parse_args()

    # Загружаем конфигурацию
    config = None
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)

    # Генерируем
    generator = JourneyGenerator(config)
    generator.generate_all()

    # Фильтруем по роли если нужно
    if args.role:
        generator.test_cases = [tc for tc in generator.test_cases if tc.role == args.role]

    # Выводим сводку
    generator.print_summary()

    # Создаём директорию
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Экспортируем
    if args.format in ['json', 'both']:
        json_path = output_dir / 'test_cases.json'
        generator.export_json(str(json_path))
        print(f"\n📄 JSON: {json_path}")

    if args.format in ['markdown', 'both']:
        md_path = output_dir / 'test_cases.md'
        generator.export_markdown(str(md_path))
        print(f"📄 Markdown: {md_path}")

    return 0


if __name__ == '__main__':
    sys.exit(main())
