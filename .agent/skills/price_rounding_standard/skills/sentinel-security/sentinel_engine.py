import os
import subprocess
import json
import sys

class SentinelSecurityEngine:
    def __init__(self, project_path="."):
        self.project_path = project_path
        self.rules_path = os.path.join(".agent", "skills", "sentinel-security", "rules", "security_rules.yaml")
        self.results = {
            "sast": [],
            "infra": [],
            "summary": {"high": 0, "medium": 0, "low": 0}
        }

    def run_sast(self):
        print("[*] Запуск SAST (Semgrep)...")
        if not os.path.exists(self.rules_path):
            print(f"[-] Ошибка: Файл правил не найден по пути {self.rules_path}")
            return

        try:
            # Используем JSON вывод для парсинга
            cmd = ["semgrep", "--config", self.rules_path, self.project_path, "--json", "--quiet"]
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')
            stdout, stderr = process.communicate()

            if process.returncode != 0 and not stdout:
                print(f"[-] Ошибка Semgrep: {stderr}")
                return

            data = json.loads(stdout)
            for result in data.get("results", []):
                severity = result.get("extra", {}).get("severity", "INFO")
                self.results["sast"].append({
                    "id": result.get("check_id"),
                    "path": result.get("path"),
                    "line": result.get("start", {}).get("line"),
                    "message": result.get("extra", {}).get("message"),
                    "severity": severity
                })
                
                # Update summary
                if severity == "ERROR": self.results["summary"]["high"] += 1
                elif severity == "WARNING": self.results["summary"]["medium"] += 1
                else: self.results["summary"]["low"] += 1

        except Exception as e:
            print(f"[-] Критическая ошибка при запуске SAST: {e}")

    def audit_infra(self):
        print("[*] Аудит инфраструктуры (DDoS/Limits)...")
        
        # 1. Проверка Nginx
        nginx_paths = ["nginx.conf", "docker/nginx.conf", "deploy/nginx.conf"]
        nginx_found = False
        for p in nginx_paths:
            full_p = os.path.join(self.project_path, p)
            if os.path.exists(full_p):
                nginx_found = True
                with open(full_p, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "limit_req_zone" not in content:
                        self.results["infra"].append({
                            "type": "Nginx",
                            "severity": "MEDIUM",
                            "message": f"В файле {p} отсутствует 'limit_req_zone'. Риск DDoS атак."
                        })
                        self.results["summary"]["medium"] += 1

        # 2. Проверка Docker Compose
        docker_files = ["docker-compose.yml", "docker-compose.prod.yml", "docker-compose.dev.yml"]
        for df in docker_files:
            full_df = os.path.join(self.project_path, df)
            if os.path.exists(full_df):
                with open(full_df, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "mem_limit" not in content and "cpus:" not in content:
                        self.results["infra"].append({
                            "type": "Docker",
                            "severity": "LOW",
                            "message": f"В {df} не установлены лимиты ресурсов (mem_limit/cpus). Риск исчерпания ресурсов (OOM)."
                        })
                        self.results["summary"]["low"] += 1

    def run_dast(self, target_url="http://localhost:3000"):
        print(f"[*] Запуск DAST (Dynamic Analysis) на {target_url}...")
        try:
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
        except ImportError:
            print("[-] Ошибка: Библиотека 'requests' не найдена. Установите: pip install requests")
            return

        # 1. Проверка заголовков
        try:
            res = requests.get(target_url, timeout=5)
            headers = res.headers
            security_headers = {
                "Content-Security-Policy": "HIGH",
                "X-Frame-Options": "MEDIUM",
                "X-Content-Type-Options": "LOW",
                "Strict-Transport-Security": "HIGH"
            }
            for h, sev in security_headers.items():
                if h not in headers:
                    self.results["infra"].append({
                        "type": "Dynamic/Headers",
                        "severity": sev,
                        "message": f"Сервер не возвращает заголовок {h}"
                    })
                    self.results["summary"][sev.lower()] += 1
        except Exception as e:
            print(f"[-] Сервер недоступен для динамического теста: {e}")
            return

        # 2. Path Fuzzing (Поиск секретов)
        sensitive_paths = [".env", ".git/config", "package.json", "old_middleware_v2.txt"]
        for path in sensitive_paths:
            try:
                test_url = f"{target_url}/{path}"
                res = requests.get(test_url, timeout=2)
                if res.status_code == 200 and len(res.content) > 0:
                    self.results["infra"].append({
                        "type": "Dynamic/Fuzzing",
                        "severity": "HIGH",
                        "message": f"Файл {path} доступен по прямой ссылке! Утечка данных."
                    })
                    self.results["summary"]["high"] += 1
            except: pass

        # 3. Rate Limit Test (DDoS Check)
        print("[*] Тестирование Rate Limiting (DDoS-стойкость)...")
        success_count = 0
        blocked_count = 0
        for _ in range(25): # Быстрая пачка запросов
            try:
                res = requests.get(f"{target_url}/api/auth/session", timeout=1)
                if res.status_code == 429:
                    blocked_count += 1
                else:
                    success_count += 1
            except: pass
        
        if blocked_count == 0:
            self.results["infra"].append({
                "type": "Dynamic/DDoS",
                "severity": "MEDIUM",
                "message": f"Rate Limit не сработал после 25 быстрых запросов. Риск DDoS."
            })
            self.results["summary"]["medium"] += 1
        else:
            print(f"[+] Rate Limit активен: заблокировано {blocked_count} запросов.")

    def generate_report(self):
        print("\n=== ОТЧЕТ Sentinel Security ===")
        print(f"Найдено High: {self.results['summary']['high']}")
        print(f"Найдено Medium: {self.results['summary']['medium']}")
        print(f"Найдено Low: {self.results['summary']['low']}")
        print("===============================\n")
        
        report_file = "security_audit_report.json"
        with open(report_file, "w", encoding='utf-8') as f:
            json.dump(self.results, f, indent=4, ensure_ascii=False)
        print(f"[*] Детальный отчет сохранен в {report_file}")

if __name__ == "__main__":
    engine = SentinelSecurityEngine()
    engine.run_sast()
    engine.audit_infra()
    engine.run_dast("http://localhost:3000")
    engine.generate_report()
