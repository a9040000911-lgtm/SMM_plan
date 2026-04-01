const fs = require('fs');

async function curate() {
    console.log('Чтение сырого каталога (856 услуг)...');
    const raw = JSON.parse(fs.readFileSync('raw_catalog.json', 'utf8'));

    console.log('Группировка по Платформе и Категории...');
    const grouped = {};
    for (const s of raw) {
        const key = `${s.platform}___${s.category}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
    }

    const curated = [];
    const tariffsList = ['Эконом', 'Эконом+', 'Стандарт', 'Премиум', 'Живые (РУ/СНГ)', 'Премиум (РУ/СНГ)'];

    for (const key of Object.keys(grouped)) {
        let items = grouped[key];
        
        // Удаляем явный мусор
        items = items.filter(i => !i.name.toLowerCase().includes('тест') && !i.name.toLowerCase().includes('test'));

        // Сортируем по цене по возрастанию для базовой логики
        items.sort((a, b) => a.price - b.price);

        if (items.length === 0) continue;

        const selected = [];

        // 1. Поиск Эконом (самый дешевый)
        const econ = items[0];
        if (econ) {
            selected.push({ ...econ, targetTier: 'Эконом' });
        }

        // 2. Поиск Эконом+ или Стандарт
        const stdCandidates = items.filter(i => 
            i.price > (econ ? econ.price * 1.5 : 0) &&
            (i.name.toLowerCase().includes('гарантия') || i.name.toLowerCase().includes('30д') || i.name.toLowerCase().includes('стандарт'))
        );
        if (stdCandidates.length > 0) {
            selected.push({ ...stdCandidates[0], targetTier: 'Стандарт' });
        } else if (items.length > 1) {
            selected.push({ ...items[Math.floor(items.length / 3)], targetTier: 'Стандарт' });
        }

        // 3. Поиск Премиум
        const premCandidates = items.filter(i => 
            i.name.toLowerCase().includes('premium') || 
            i.name.toLowerCase().includes('премиум') || 
            i.name.toLowerCase().includes('без списаний')
        );
        if (premCandidates.length > 0) {
            // Самый дорогой из премиумов
            premCandidates.sort((a, b) => b.price - a.price);
            selected.push({ ...premCandidates[0], targetTier: 'Премиум' });
        } else if (items.length > 2) {
            selected.push({ ...items[items.length - 1], targetTier: 'Премиум' });
        }

        // 4. Поиск РУ/СНГ (Живые / Премиум РУ)
        const ruCandidates = items.filter(i => 
            i.name.toLowerCase().includes('ру') || 
            i.name.toLowerCase().includes('ru') || 
            i.name.toLowerCase().includes('росс') || 
            i.name.toLowerCase().includes('снг') ||
            i.name.toLowerCase().includes('живые')
        );
        if (ruCandidates.length > 0) {
            // Если дешевый -> Живые (РУ)
            // Если дорогой -> Премиум (РУ)
            ruCandidates.sort((a,b) => b.price - a.price);
            selected.push({ ...ruCandidates[0], targetTier: 'Премиум (РУ/СНГ)' });
            if (ruCandidates.length > 1) {
                selected.push({ ...ruCandidates[ruCandidates.length - 1], targetTier: 'Живые (РУ/СНГ)' });
            }
        }

        // Дедупликация (чтобы одна услуга не попала в два тарифа)
        const unique = [];
        const seenIds = new Set();
        for (const s of selected) {
            if (!seenIds.has(s.id)) {
                seenIds.add(s.id);
                unique.push(s);
            }
        }

        curated.push(...unique);
    }

    console.log(`Отобрано уникальных услуг: ${curated.length}`);

    // Сохраним мастер-файл в CSV для просмотра
    const csvHeader = 'Платформа;Категория;Тариф;Цена;Название\n';
    const csvRows = curated.map(c => `${c.platform};${c.category};${c.targetTier};${c.price};${c.name}`).join('\n');
    fs.writeFileSync('curated_catalog.csv', '\uFEFF' + csvHeader + csvRows, 'utf8');
    
    // Сохраним в чанки по 25 штук
    const CHUNK_SIZE = 25;
    if (!fs.existsSync('temp_batches')) fs.mkdirSync('temp_batches');
    
    for (let i = 0; i < curated.length; i += CHUNK_SIZE) {
        const chunk = curated.slice(i, i + CHUNK_SIZE);
        fs.writeFileSync(`temp_batches/chunk_${Math.floor(i/CHUNK_SIZE) + 1}.json`, JSON.stringify(chunk, null, 2));
    }

    console.log('Готово! Сохранено в CSV и разбито на чанки в папке temp_batches/.');
}

curate().catch(console.error);
