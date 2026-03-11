import sys
import os
import requests
import re

def slugify(text):
    """Превращает 'Google Drive' в 'googledrive' для API"""
    return re.sub(r'[^a-z0-9]', '', text.lower())

def fetch_svg(brand_name, target_dir):
    slug = slugify(brand_name)
    # URL официального CDN Simple Icons
    url = f"https://cdn.simpleicons.org/{slug}"
    
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    file_path = os.path.join(target_dir, f"{slug}.svg")
    
    try:
        response = requests.get(url)
        if response.status_code == 200 and "<svg" in response.text:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(response.text)
            print(f"SUCCESS: SVG для '{brand_name}' сохранен в {file_path}")
            # Возвращаем путь для агента, чтобы он мог использовать его в коде
            return file_path
        else:
            print(f"ERROR: Логотип для '{brand_name}' не найден. Попробуй другое название.")
            return None
    except Exception as e:
        print(f"EXCEPTION: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        brand = sys.argv[1]
        # Если второй аргумент не передан, сохраняем в дефолтную папку
        folder = sys.argv[2] if len(sys.argv) > 2 else "./src/assets/icons"
        fetch_svg(brand, folder)
