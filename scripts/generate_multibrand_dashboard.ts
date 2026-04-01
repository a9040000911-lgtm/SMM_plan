import * as fs from 'fs';
import * as path from 'path';

function run() {
    // 1. PrimeLike Data
    const primeLikeRevCents = 8527231454; // approximate revenue from previous calculation ~85.2M
    const primeLikeOrders = 1290105;
    
    // 2. Read new sites
    let summary: Record<string, any> = {};
    const summaryPath = path.join(process.cwd(), 'scripts', 'other_sites_summary.json');
    if (fs.existsSync(summaryPath)) {
        summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    }

    // Merge for Chart
    const sites = ['primelike.ru', 'bestsmm.ru', 'spetsnakrutka.ru', 'prodvigaika.ru'];
    
    const ordersData = [
        primeLikeOrders,
        summary['bestsmm.ru']?.totalOrders || 0,
        summary['spetsnakrutka.ru']?.totalOrders || 0,
        summary['prodvigaika.ru']?.totalOrders || 0
    ];

    const revDataList = [
        Math.round(primeLikeRevCents / 100),
        Math.round((summary['bestsmm.ru']?.revenueCents || 0) / 100),
        Math.round((summary['spetsnakrutka.ru']?.revenueCents || 0) / 100),
        Math.round((summary['prodvigaika.ru']?.revenueCents || 0) / 100)
    ];

    const cancelRates = [
        6.8, // primelike
        ((summary['bestsmm.ru']?.cancelled || 0) / (summary['bestsmm.ru']?.totalOrders || 1)) * 100,
        ((summary['spetsnakrutka.ru']?.cancelled || 0) / (summary['spetsnakrutka.ru']?.totalOrders || 1)) * 100,
        ((summary['prodvigaika.ru']?.cancelled || 0) / (summary['prodvigaika.ru']?.totalOrders || 1)) * 100
    ].map(v => v.toFixed(1));

    const taxRate = 0.06; // 6% taxes
    const monthlyPayroll = 200000;
    
    // Calculate oldest date to find total months
    let minDateStr = '9999-12-31';
    for (const s of Object.values(summary) as any[]) {
        if (s.firstDate && s.firstDate < minDateStr && s.firstDate > '2020-01-01') minDateStr = s.firstDate;
    }
    // Assume prime like started around 2024-05-01 based on previous data
    if (minDateStr === '9999-12-31') minDateStr = '2024-05-01';

    const startDate = new Date(minDateStr);
    const endDate = new Date('2026-03-29'); // Current context date
    const monthsActive = Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()));

    const totalRevenue = revDataList.reduce((a, b) => a + b, 0);
    const totalProviderCost = totalRevenue * 0.076; // 7.6% provider costs
    const grossProfit = totalRevenue - totalProviderCost;
    
    const totalTaxes = totalRevenue * taxRate;
    const totalPayroll = monthlyPayroll * monthsActive;
    
    const netProfit = grossProfit - totalTaxes - totalPayroll;

    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMMToolbox — Зонтичная Сеть Проектов</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .card h3 { margin: 0 0 16px 0; font-size: 16px; color: #4b5563; }
        .info { background: #e0f2fe; color: #075985; padding: 16px; border-radius: 8px; margin-bottom: 24px; outline: 1px solid #7dd3fc; }
        .alert { background: #fef3c7; color: #92400e; padding: 16px; border-radius: 8px; margin-bottom: 24px; outline: 1px solid #fcd34d; }
        .chart-container { position: relative; height: 350px; width: 100%; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: 600; color: #374151; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div style="font-size: 24px; font-weight: bold;">SMMToolbox — Мультибрендовая Зонтичная Сеть</div>
                <div style="color: #6b7280; font-size: 14px;">Финансовая и маркетинговая конверсия между платформами (PrimeLike / SpetsNakrutka / BestSMM / Prodvigaika)</div>
            </div>
        </div>

        <div class="info">
            <strong>Рекламная Стратегия Сателлитов:</strong> Поиск на VC.ru и DTF доказал, что <code>bestsmm.ru</code> и <code>prodvigaika.ru</code> используются в статьях как "иллюзия выбора". Конкурент публикует рейтинг и ставит на 1-е место <b>PrimeLike</b>, а на 3-е/4-е места свои же проекты-сателлиты. Таким образом, он собирает весь SEO-трафик и диверсифицирует риски.
        </div>

        <div class="grid">
            <div class="card" style="background-color: #f8fafc; border-left: 4px solid #10b981;">
                <h3>Экономика Сети (за ~${monthsActive} мес.)</h3>
                <div style="font-size: 14px; line-height: 1.8;">
                    <div><strong>Общая выручка:</strong> ${new Intl.NumberFormat('ru-RU').format(Math.round(totalRevenue))} ₽</div>
                    <div style="color: #ef4444;"><strong>Себестоимость провайдеров (~7.6%):</strong> -${new Intl.NumberFormat('ru-RU').format(Math.round(totalProviderCost))} ₽</div>
                    <div style="color: #ef4444;"><strong>Налоги (УСН 6%):</strong> -${new Intl.NumberFormat('ru-RU').format(Math.round(totalTaxes))} ₽</div>
                    <div style="color: #ef4444;"><strong>ФОТ (200k/мес):</strong> -${new Intl.NumberFormat('ru-RU').format(Math.round(totalPayroll))} ₽</div>
                    <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 8px 0;">
                    <div style="font-size: 18px; color: #10b981;"><strong>Чистая Прибыль:</strong> ${new Intl.NumberFormat('ru-RU').format(Math.round(netProfit))} ₽</div>
                </div>
            </div>
            
            <div class="card">
                <h3>Объемы Заказов по Проектам</h3>
                <div class="chart-container">
                    <canvas id="ordersChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h3>Выручка по Проектам (Доля выручки в сети)</h3>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>Сравнительная Аналитика Платформ</h3>
            <table>
                <thead>
                    <tr>
                        <th>Проект</th>
                        <th>Всего заказов</th>
                        <th>Выручка (Оценка)</th>
                        <th>% Отмен (Quality)</th>
                        <th>Маркетинговый Статус</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>primelike.ru</strong></td>
                        <td>${new Intl.NumberFormat('ru-RU').format(ordersData[0])}</td>
                        <td>${new Intl.NumberFormat('ru-RU').format(revDataList[0])} ₽</td>
                        <td>${cancelRates[0]}%</td>
                        <td>🔥 Флагман (Основной бюджет PR)</td>
                    </tr>
                    <tr>
                        <td><strong>bestsmm.ru</strong></td>
                        <td>${new Intl.NumberFormat('ru-RU').format(ordersData[1])}</td>
                        <td>${new Intl.NumberFormat('ru-RU').format(revDataList[1])} ₽</td>
                        <td>${cancelRates[1]}%</td>
                        <td>Сайт-сателлит в рейтингах</td>
                    </tr>
                    <tr>
                        <td><strong>spetsnakrutka.ru</strong></td>
                        <td>${new Intl.NumberFormat('ru-RU').format(ordersData[2])}</td>
                        <td>${new Intl.NumberFormat('ru-RU').format(revDataList[2])} ₽</td>
                        <td>${cancelRates[2]}%</td>
                        <td>Офферный/Запасной домен</td>
                    </tr>
                    <tr>
                        <td><strong>prodvigaika.ru</strong></td>
                        <td>${new Intl.NumberFormat('ru-RU').format(ordersData[3])}</td>
                        <td>${new Intl.NumberFormat('ru-RU').format(revDataList[3])} ₽</td>
                        <td>${cancelRates[3]}%</td>
                        <td>Мертвый сателлит / SEO-якорь</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        const ctxOrders = document.getElementById('ordersChart').getContext('2d');
        const ctxRev = document.getElementById('revenueChart').getContext('2d');
        const labels = ${JSON.stringify(sites)};
        const ordersData = ${JSON.stringify(ordersData)};
        const revData = ${JSON.stringify(revDataList)};
        
        const colors = [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
        ];

        new Chart(ctxOrders, {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: ordersData, backgroundColor: colors }] },
            options: { responsive: true, maintainAspectRatio: false }
        });

        new Chart(ctxRev, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выручка (₽)',
                    data: revData,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return (value / 1000000).toFixed(1) + 'M ₽'; }
                        }
                    } 
                }
            }
        });
    </script>
</body>
</html>
`;
    
    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'competitor_multibrand_dashboard.html'), html);
    console.log('Дашборд сохранен!');
}

run();
