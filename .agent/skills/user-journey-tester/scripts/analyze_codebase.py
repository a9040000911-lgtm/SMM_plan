#!/usr/bin/env python3
"""
Анализатор кодовой базы Next.js для построения User Journeys.
Автоматически находит все маршруты, server actions, API endpoints, компоненты.

Использование:
    python analyze_codebase.py --path /path/to/nextjs/project --output analysis/
    python analyze_codebase.py --path ./smm-panel --output ./analysis --full
"""

import argparse
import os
import re
import json
import sys
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional, Set
from datetime import datetime


@dataclass
class Route:
    """Маршрут Next.js App Router."""
    path: str
    file: str
    type: str  # page, layout, loading, error, not-found, api
    params: List[str] = field(default_factory=list)
    middleware: bool = False


@dataclass
class ServerAction:
    """Server Action в Next.js."""
    name: str
    file: str
    line: int
    parameters: List[str] = field(default_factory=list)
    returns: Optional[str] = None


@dataclass
class APIEndpoint:
    """API Route Handler."""
    path: str
    file: str
    methods: List[str] = field(default_factory=list)
    auth_required: bool = False


@dataclass
class UIComponent:
    """UI компонент с интерактивными элементами."""
    name: str
    file: str
    buttons: List[Dict] = field(default_factory=list)
    forms: List[Dict] = field(default_factory=list)
    links: List[Dict] = field(default_factory=list)


@dataclass
class TextContent:
    """Текстовый контент для проверки локализации."""
    key: str
    text: str
    file: str
    line: int
    type: str  # button, label, placeholder, error, success


class NextJSAnalyzer:
    """Анализатор Next.js проектов."""

    # Паттерны для поиска
    PATTERNS = {
        'page': r'app/(.+)/page\.tsx?$',
        'layout': r'app/(.+)/layout\.tsx?$',
        'loading': r'app/(.+)/loading\.tsx?$',
        'error': r'app/(.+)/error\.tsx?$',
        'api': r'app/api/(.+)/route\.tsx?$',
        'server_action': r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::\s*Promise<[^>]+>)?\s*\{[^}]*server',
        'button': r'<Button[^>]*>([^<]+)</Button>',
        'button_aria': r'<button[^>]*(?:aria-label|title)=["\']([^"\']+)["\']',
        'input_placeholder': r'placeholder=["\']([^"\']+)["\']',
        'link': r'<Link[^>]*href=["\']([^"\']+)["\']',
        'use_action': r'useServerAction\s*\(\s*(\w+)\s*\)',
        'text_ru': r'["\']([А-Яа-яЁё\s\.,!?%\-:0-9]+)["\']',
    }

    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.routes: List[Route] = []
        self.server_actions: List[ServerAction] = []
        self.api_endpoints: List[APIEndpoint] = []
        self.ui_components: List[UIComponent] = []
        self.text_contents: List[TextContent] = []
        self.user_journeys: List[Dict] = []

    def analyze(self) -> Dict[str, Any]:
        """Выполняет полный анализ проекта."""
        print(f"🔍 Анализ проекта: {self.project_path}")
        
        # 1. Находим маршруты
        self._find_routes()
        print(f"   ✓ Маршруты: {len(self.routes)}")
        
        # 2. Находим Server Actions
        self._find_server_actions()
        print(f"   ✓ Server Actions: {len(self.server_actions)}")
        
        # 3. Находим API endpoints
        self._find_api_endpoints()
        print(f"   ✓ API Endpoints: {len(self.api_endpoints)}")
        
        # 4. Анализируем UI компоненты
        self._analyze_ui_components()
        print(f"   ✓ UI Компоненты: {len(self.ui_components)}")
        
        # 5. Извлекаем текстовый контент
        self._extract_text_content()
        print(f"   ✓ Текстовые элементы: {len(self.text_contents)}")
        
        # 6. Строим User Journeys
        self._build_user_journeys()
        print(f"   ✓ User Journeys: {len(self.user_journeys)}")
        
        return self._generate_report()

    def _find_routes(self):
        """Находит все маршруты App Router."""
        app_dir = self.project_path / 'app'
        
        if not app_dir.exists():
            # Пробуем src/app
            app_dir = self.project_path / 'src' / 'app'
        
        if not app_dir.exists():
            return

        for file_path in app_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix in ['.tsx', '.ts']:
                rel_path = str(file_path.relative_to(app_dir))
                
                # Определяем тип файла
                route_type = None
                if file_path.name.startswith('page.'):
                    route_type = 'page'
                elif file_path.name.startswith('layout.'):
                    route_type = 'layout'
                elif file_path.name.startswith('loading.'):
                    route_type = 'loading'
                elif file_path.name.startswith('error.'):
                    route_type = 'error'
                elif file_path.name == 'route.ts' or file_path.name == 'route.tsx':
                    route_type = 'api'
                
                if route_type:
                    # Извлекаем путь
                    dir_path = str(file_path.parent.relative_to(app_dir))
                    if dir_path == '.':
                        url_path = '/'
                    else:
                        url_path = '/' + dir_path.replace('\\', '/')
                        # Обрабатываем динамические сегменты
                        url_path = re.sub(r'\[([^\]]+)\]', r':\1', url_path)
                        url_path = re.sub(r'\(\w+\)', '', url_path)  # Route groups
                    
                    # Находим параметры
                    params = re.findall(r'\[([^\]]+)\]', str(file_path.parent))
                    
                    self.routes.append(Route(
                        path=url_path,
                        file=str(file_path.relative_to(self.project_path)),
                        type=route_type,
                        params=params
                    ))

    def _find_server_actions(self):
        """Находит Server Actions в файлах."""
        for file_path in self.project_path.rglob('*.ts*'):
            if 'node_modules' in str(file_path):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Ищем 'use server' директиву
                if "'use server'" in content or '"use server"' in content:
                    # Находим все экспортируемые функции
                    matches = re.finditer(
                        r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)',
                        content
                    )
                    
                    for match in matches:
                        start_pos = match.start()
                        # Проверяем, что функция после 'use server'
                        use_server_pos = content.find("'use server'")
                        if use_server_pos == -1:
                            use_server_pos = content.find('"use server"')
                        
                        if start_pos > use_server_pos:
                            # Находим номер строки
                            line_num = content[:start_pos].count('\n') + 1
                            
                            # Извлекаем параметры
                            params_str = match.group(2)
                            params = [p.strip() for p in params_str.split(',') if p.strip()]
                            
                            self.server_actions.append(ServerAction(
                                name=match.group(1),
                                file=str(file_path.relative_to(self.project_path)),
                                line=line_num,
                                parameters=params
                            ))
            except Exception:
                pass

    def _find_api_endpoints(self):
        """Находит API Route Handlers."""
        for route in self.routes:
            if route.type == 'api':
                # Читаем файл для определения методов
                file_path = self.project_path / route.file
                
                try:
                    content = file_path.read_text(encoding='utf-8')
                    
                    methods = []
                    for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                        if f'export async function {method}' in content:
                            methods.append(method)
                    
                    # Проверяем наличие авторизации
                    auth_required = any(kw in content for kw in 
                        ['getServerSession', 'auth()', 'getToken', 'headers()', 'session'])
                    
                    self.api_endpoints.append(APIEndpoint(
                        path=route.path,
                        file=route.file,
                        methods=methods,
                        auth_required=auth_required
                    ))
                except Exception:
                    pass

    def _analyze_ui_components(self):
        """Анализирует UI компоненты на наличие интерактивных элементов."""
        for file_path in self.project_path.rglob('*.tsx'):
            if 'node_modules' in str(file_path):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                
                buttons = []
                forms = []
                links = []
                
                # Находим кнопки
                for match in re.finditer(self.PATTERNS['button'], content, re.IGNORECASE):
                    buttons.append({
                        'text': match.group(1).strip(),
                        'type': 'Button component'
                    })
                
                for match in re.finditer(self.PATTERNS['button_aria'], content, re.IGNORECASE):
                    buttons.append({
                        'text': match.group(1).strip(),
                        'type': 'aria-label'
                    })
                
                # Находим ссылки
                for match in re.finditer(self.PATTERNS['link'], content, re.IGNORECASE):
                    href = match.group(1)
                    links.append({
                        'href': href,
                        'type': 'internal' if href.startswith('/') else 'external'
                    })
                
                # Находим формы
                form_pattern = r'<form[^>]*action=["\']([^"\']+)["\']'
                for match in re.finditer(form_pattern, content, re.IGNORECASE):
                    forms.append({
                        'action': match.group(1),
                        'type': 'server_action' if 'action' in match.group(1) else 'api'
                    })
                
                if buttons or forms or links:
                    component_name = file_path.stem
                    self.ui_components.append(UIComponent(
                        name=component_name,
                        file=str(file_path.relative_to(self.project_path)),
                        buttons=buttons,
                        forms=forms,
                        links=links
                    ))
            except Exception:
                pass

    def _extract_text_content(self):
        """Извлекает русский текст для проверки локализации."""
        for file_path in self.project_path.rglob('*.tsx'):
            if 'node_modules' in str(file_path):
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for line_num, line in enumerate(lines, 1):
                    # Ищем русский текст
                    for match in re.finditer(self.PATTERNS['text_ru'], line):
                        text = match.group(1).strip()
                        if len(text) > 2:  # Игнорируем очень короткие
                            # Определяем тип по контексту
                            text_type = 'text'
                            if 'Button' in line or '<button' in line.lower():
                                text_type = 'button'
                            elif 'placeholder' in line:
                                text_type = 'placeholder'
                            elif 'label' in line.lower():
                                text_type = 'label'
                            elif 'error' in line.lower() or 'ошибка' in text.lower():
                                text_type = 'error'
                            elif 'успешно' in text.lower() or 'success' in line.lower():
                                text_type = 'success'
                            
                            self.text_contents.append(TextContent(
                                key=f"{file_path.stem}:{line_num}",
                                text=text,
                                file=str(file_path.relative_to(self.project_path)),
                                line=line_num,
                                type=text_type
                            ))
            except Exception:
                pass

    def _build_user_journeys(self):
        """Строит User Journeys на основе найденных маршрутов и действий."""
        
        # Группируем маршруты по модулям
        modules = {}
        for route in self.routes:
            if route.type == 'page':
                parts = route.path.strip('/').split('/')
                module = parts[0] if parts[0] else 'home'
                
                if module not in modules:
                    modules[module] = {'routes': [], 'actions': [], 'apis': []}
                modules[module]['routes'].append(route)
        
        # Привязываем server actions к модулям
        for action in self.server_actions:
            for module, data in modules.items():
                for route in data['routes']:
                    if module in action.file:
                        data['actions'].append(action)
                        break
        
        # Привязываем API endpoints к модулям
        for api in self.api_endpoints:
            parts = api.path.strip('/api/').split('/')
            module = parts[0] if parts else 'api'
            
            if module in modules:
                modules[module]['apis'].append(api)
        
        # Генерируем journeys
        for module, data in modules.items():
            for route in data['routes']:
                # Happy path
                journey = {
                    'id': f"JOURNEY-{module}-{route.path.replace('/', '-')}",
                    'module': module,
                    'route': route.path,
                    'type': 'discovered',
                    'steps': self._generate_steps_for_route(route, data),
                    'actions_available': [a.name for a in data['actions']],
                    'apis_used': [a.path for a in data['apis']],
                    'role': self._determine_role(route.path)
                }
                self.user_journeys.append(journey)

    def _generate_steps_for_route(self, route: Route, module_data: Dict) -> List[Dict]:
        """Генерирует шаги для маршрута."""
        steps = []
        
        # Базовый шаг - навигация
        steps.append({
            'step': 1,
            'action': f'Перейти на страницу {route.path}',
            'expected': 'Страница загружается',
            'check': 'URL соответствует ожидаемому'
        })
        
        # Если есть параметры - добавляем шаг подготовки
        if route.params:
            steps.append({
                'step': 2,
                'action': f'Подготовить данные для параметров: {route.params}',
                'expected': 'Данные подготовлены',
                'check': 'Параметры валидны'
            })
        
        # Добавляем доступные действия
        for i, action in enumerate(module_data.get('actions', [])[:3], start=len(steps) + 1):
            steps.append({
                'step': i,
                'action': f'Выполнить действие: {action.name}',
                'expected': 'Действие выполняется успешно',
                'check': 'Результат соответствует ожиданию'
            })
        
        return steps

    def _determine_role(self, path: str) -> str:
        """Определяет роль по пути."""
        if '/admin' in path:
            return 'ADMIN'
        elif '/api' in path:
            return 'SYSTEM'
        else:
            return 'USER'

    def _generate_report(self) -> Dict[str, Any]:
        """Генерирует итоговый отчёт."""
        return {
            'project_path': str(self.project_path),
            'analyzed_at': datetime.now().isoformat(),
            'summary': {
                'total_routes': len(self.routes),
                'pages': len([r for r in self.routes if r.type == 'page']),
                'api_endpoints': len(self.api_endpoints),
                'server_actions': len(self.server_actions),
                'ui_components': len(self.ui_components),
                'text_elements': len(self.text_contents),
                'discovered_journeys': len(self.user_journeys)
            },
            'routes': [asdict(r) for r in self.routes],
            'server_actions': [asdict(a) for a in self.server_actions],
            'api_endpoints': [asdict(e) for e in self.api_endpoints],
            'ui_components': [asdict(c) for c in self.ui_components],
            'text_contents': [asdict(t) for t in self.text_contents],
            'user_journeys': self.user_journeys
        }

    def export_json(self, output_path: str):
        """Экспортирует результаты в JSON."""
        report = self._generate_report()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)
        
        return output_path

    def export_markdown(self, output_path: str):
        """Экспортирует результаты в Markdown."""
        report = self._generate_report()
        
        lines = [
            f"# Анализ кодовой базы: {self.project_path.name}",
            "",
            f"**Дата анализа:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "## 📊 Сводка",
            "",
            f"| Метрика | Значение |",
            f"|---------|----------|",
            f"| Страниц (Pages) | {report['summary']['pages']} |",
            f"| API Endpoints | {report['summary']['api_endpoints']} |",
            f"| Server Actions | {report['summary']['server_actions']} |",
            f"| UI Компоненты | {report['summary']['ui_components']} |",
            f"| Текстовых элементов | {report['summary']['text_elements']} |",
            f"| Обнаружено journeys | {report['summary']['discovered_journeys']} |",
            "",
            "## 🗺️ Маршруты (Routes)",
            "",
        ]

        # Группируем по типу
        pages = [r for r in self.routes if r.type == 'page']
        apis = [r for r in self.routes if r.type == 'api']
        
        if pages:
            lines.append("### Страницы")
            lines.append("")
            lines.append("| Путь | Файл | Параметры |")
            lines.append("|------|------|-----------|")
            for route in sorted(pages, key=lambda r: r.path):
                params = ', '.join(route.params) if route.params else '—'
                lines.append(f"| `{route.path}` | `{route.file}` | {params} |")
            lines.append("")
        
        if apis:
            lines.append("### API Endpoints")
            lines.append("")
            lines.append("| Путь | Методы | Авторизация |")
            lines.append("|------|--------|-------------|")
            for api in sorted(self.api_endpoints, key=lambda a: a.path):
                methods = ', '.join(api.methods) if api.methods else '—'
                auth = '✅' if api.auth_required else '❌'
                lines.append(f"| `{api.path}` | {methods} | {auth} |")
            lines.append("")

        # Server Actions
        if self.server_actions:
            lines.append("## ⚡ Server Actions")
            lines.append("")
            lines.append("| Название | Файл | Параметры |")
            lines.append("|----------|------|-----------|")
            for action in self.server_actions[:20]:  # Ограничиваем вывод
                params = ', '.join(action.parameters[:3]) if action.parameters else '—'
                lines.append(f"| `{action.name}` | `{action.file}` | {params} |")
            if len(self.server_actions) > 20:
                lines.append(f"| ... и ещё {len(self.server_actions) - 20} действий | | |")
            lines.append("")

        # UI Компоненты
        if self.ui_components:
            lines.append("## 🖱️ UI Компоненты (интерактивные элементы)")
            lines.append("")
            
            # Подсчитываем кнопки
            total_buttons = sum(len(c.buttons) for c in self.ui_components)
            total_links = sum(len(c.links) for c in self.ui_components)
            
            lines.append(f"Всего кнопок: **{total_buttons}**")
            lines.append(f"Всего ссылок: **{total_links}**")
            lines.append("")
            
            # Примеры кнопок
            lines.append("### Примеры кнопок")
            lines.append("")
            for comp in self.ui_components[:5]:
                if comp.buttons:
                    lines.append(f"**{comp.name}:**")
                    for btn in comp.buttons[:5]:
                        lines.append(f"- {btn['text']} ({btn['type']})")
            lines.append("")

        # Текстовые элементы для локализации
        if self.text_contents:
            lines.append("## 📝 Текстовые элементы (локализация)")
            lines.append("")
            
            # Группируем по типу
            by_type = {}
            for tc in self.text_contents:
                if tc.type not in by_type:
                    by_type[tc.type] = []
                by_type[tc.type].append(tc)
            
            for text_type, items in by_type.items():
                lines.append(f"### {text_type.capitalize()} ({len(items)})")
                lines.append("")
                for item in items[:10]:
                    lines.append(f"- \"{item.text}\"")
                if len(items) > 10:
                    lines.append(f"- ... и ещё {len(items) - 10}")
                lines.append("")

        # Обнаруженные User Journeys
        if self.user_journeys:
            lines.append("## 🔄 Обнаруженные User Journeys")
            lines.append("")
            
            for journey in self.user_journeys[:15]:
                lines.append(f"### {journey['id']}")
                lines.append(f"**Модуль:** {journey['module']}")
                lines.append(f"**Роль:** {journey['role']}")
                lines.append(f"**Путь:** `{journey['route']}`")
                
                if journey['steps']:
                    lines.append("")
                    lines.append("| Шаг | Действие | Ожидание |")
                    lines.append("|-----|----------|----------|")
                    for step in journey['steps']:
                        lines.append(f"| {step['step']} | {step['action']} | {step['expected']} |")
                lines.append("")

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))

        return output_path

    def print_summary(self):
        """Выводит сводку в консоль."""
        report = self._generate_report()
        
        print("\n" + "="*60)
        print("📊 РЕЗУЛЬТАТЫ АНАЛИЗА")
        print("="*60)
        print(f"📁 Проект: {self.project_path.name}")
        print("-"*60)
        print(f"📄 Страниц: {report['summary']['pages']}")
        print(f"🔌 API Endpoints: {report['summary']['api_endpoints']}")
        print(f"⚡ Server Actions: {report['summary']['server_actions']}")
        print(f"🖱️ UI Компонентов: {report['summary']['ui_components']}")
        print(f"📝 Текстовых элементов: {report['summary']['text_elements']}")
        print(f"🔄 Обнаружено journeys: {report['summary']['discovered_journeys']}")
        print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description='Анализатор кодовой базы Next.js для построения User Journeys'
    )
    parser.add_argument('--path', '-p', required=True, 
                        help='Путь к Next.js проекту')
    parser.add_argument('--output', '-o', default='.',
                        help='Директория для вывода результатов')
    parser.add_argument('--format', '-f', 
                        choices=['json', 'markdown', 'both'],
                        default='both',
                        help='Формат вывода')
    parser.add_argument('--full', action='store_true',
                        help='Полный анализ включая node_modules')

    args = parser.parse_args()

    if not os.path.isdir(args.path):
        print(f"❌ Ошибка: Директория '{args.path}' не найдена")
        return 1

    # Создаём директорию вывода
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Запускаем анализ
    analyzer = NextJSAnalyzer(args.path)
    analyzer.analyze()
    analyzer.print_summary()

    # Экспортируем результаты
    if args.format in ['json', 'both']:
        json_path = output_dir / 'codebase_analysis.json'
        analyzer.export_json(str(json_path))
        print(f"\n📄 JSON: {json_path}")

    if args.format in ['markdown', 'both']:
        md_path = output_dir / 'codebase_analysis.md'
        analyzer.export_markdown(str(md_path))
        print(f"📄 Markdown: {md_path}")

    return 0


if __name__ == '__main__':
    sys.exit(main())
