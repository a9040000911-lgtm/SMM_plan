import fetch from 'node-fetch';

async function checkYtLab() {
    const url = "https://dashboard.theytlab.com/api/v2";
    const key = "e82fd7e2b37c6c113d3c4fe3e83030f5";
    
    const formData = new URLSearchParams();
    formData.append('key', key);
    formData.append('action', 'services');

    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    
    // Показываем первые 15 услуг, переводим цену из $ на 1000 единиц по курсу 95
    console.log("🔥 ТОП Услуг TheYTLab (YouTube Первоисточник):");
    const services = Array.isArray(data) ? data : Object.values<any>(data);
    
    services.slice(0, 15).forEach(s => {
        const rubPrice = Number(s.rate) * 95;
        console.log(`- [${s.category}] ${s.name.substring(0, 50)} | Цена: ${rubPrice.toFixed(2)}₽ за 1000 | Лимиты: ${s.min}-${s.max}`);
    });
}
checkYtLab();
