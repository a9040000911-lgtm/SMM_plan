import fetch from 'node-fetch';
import * as fs from 'fs';

async function listYTLabServices() {
    console.log('⏳ Получение каталога TheYTLab...');
    
    const ytLabKey = 'e82fd7e2b37c6c113d3c4fe3e83030f5';
    const form = new URLSearchParams();
    form.append('key', ytLabKey);
    form.append('action', 'services');

    const res = await fetch('https://dashboard.theytlab.com/api/v2', { method: 'POST', body: form });
    const data = await res.json();
    const ytServices: any[] = Array.isArray(data) ? data : Object.values<any>(data);
    
    // Переводим цены YTLab в рубли (курс 95)
    ytServices.forEach(s => {
        s.rubPrice = Number(s.rate) * 95;
    });

    console.log('📦 Услуг YTLab получено:', ytServices.length);

    // Группируем по категориям
    const categorized: Record<string, any[]> = {};
    for (const s of ytServices) {
        if (!categorized[s.category]) {
            categorized[s.category] = [];
        }
        categorized[s.category].push(s);
    }

    let md = '# 📺 Каталог TheYTLab (Первоисточник YouTube)\n\n';
    md += '> Это полный список услуг от провайдера TheYTLab. Цены указаны за 1000 шт в рублях (по курсу 95).\n\n';

    for (const [category, services] of Object.entries(categorized)) {
        md += `## 📁 ${category}\n\n`;
        md += `| ID | Название услуги | Мин | Макс | Цена за 1000 (₽) |\n`;
        md += `|---|---|---|---|---|\n`;
        
        services.sort((a, b) => a.rubPrice - b.rubPrice);
        
        for (const s of services) {
            md += `| **${s.service}** | ${s.name} | ${s.min} | ${s.max} | **${parseFloat(s.rubPrice.toFixed(2))} ₽** |\n`;
        }
        md += '\n';
    }

    fs.writeFileSync('C:/Users/Артём/.gemini/antigravity/brain/ddd5cb1c-a218-4547-a5cd-9bb778c3a929/YTLAB_CATALOG.md', md, 'utf8');
    
    console.log(`\n✅ Готово! Каталог сохранен в артефакт YTLAB_CATALOG.md`);
}

listYTLabServices();
