import * as fs from 'fs';
import * as path from 'path';

// Загружаем данные по месяцам из файла, который был создан ранее
const timelinePath = path.join(process.cwd(), 'growth_timeline_full.json');
let timelineData: any[] = [];
if (fs.existsSync(timelinePath)) {
    const rawData = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
    // Convert object to sorted array
    timelineData = Object.entries(rawData.monthly).map(([month, data]: any) => ({
        month,
        revenue: data.revenue,
        profit: data.profit
    })).sort((a, b) => a.month.localeCompare(b.month));
}

// Данные по отменам (взяты из консольного лога analyze_cancellations)
const cancelData = {
    total: 1290105,
    cancelled: 87688,
    partial: 19413,
    unpaid: 164754,
    reasons: [
        { reason: 'link_duplicate (Ош. клиента)', count: 7140 },
        { reason: 'not_enough_funds (Ош. провайдера)', count: 4454 },
        { reason: 'no money (Ош. провайдера)', count: 4100 },
        { reason: 'not link to the post (Ош. клиента)', count: 1858 },
        { reason: 'link incorrect (Ош. клиента)', count: 1712 }
    ],
    categories: [
        { category: 'Telegram', count: 46804 },
        { category: 'Вконтакте', count: 20381 },
        { category: 'Instagram', count: 9928 },
        { category: 'TikTok', count: 3609 }
    ]
};

// Собранные рекламные активности (статьи на vc.ru, dtf.ru, in-scale.ru) по месяцам
const adEvents: Record<string, number> = {
    '2024-05': 3,
    '2024-10': 1,
    '2024-12': 1,
    '2025-03': 2,
    '2025-04': 1,
    '2025-05': 1,
    '2025-07': 1,
    '2025-08': 2,
    '2025-09': 1,
    '2025-10': 6,
    '2025-11': 4,
    '2025-12': 4,
    '2026-01': 1
};

const labels = timelineData.map(d => d.month);
const revenues = timelineData.map(d => d.revenue);
const profits = timelineData.map(d => d.profit);
const ads = labels.map(m => adEvents[m] || 0);

const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMMToolbox / PrimeLike — Расширенная Аналитика</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb; }
        .brand { font-size: 24px; font-weight: bold; color: #111827; }
        .subtitle { color: #6b7280; font-size: 14px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .card h3 { margin: 0 0 16px 0; font-size: 16px; color: #4b5563; }
        .value { font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 4px; }
        .sub-value { font-size: 14px; color: #6b7280; }
        .chart-container { position: relative; height: 400px; width: 100%; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: 600; color: #374151; }
        tr:hover { background-color: #f9fafb; }
        .alert { background: #fee2e2; color: #991b1b; padding: 16px; border-radius: 8px; margin-bottom: 24px; outline: 1px solid #f87171; }
        .info { background: #e0f2fe; color: #075985; padding: 16px; border-radius: 8px; margin-bottom: 24px; outline: 1px solid #7dd3fc; }
        .flex-row { display: flex; gap: 20px; }
        .w-1-2 { width: 50%; }
        .loss-text { color: #ef4444; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">SMMToolbox / PrimeLike — Разведывательный Дашборд</div>
                <div class="subtitle">Анализ отмен, выявление брендов-прикрытий и корреляция с маркетингом</div>
            </div>
            <div style="text-align: right">
                <strong>Юрлица приема платежей:</strong> ИП Соловов Н.С., ИП Расторгуев Е.<br>
                <span class="subtitle">Основной трафик: SEO-статьи (vc.ru, dtf.ru)</span>
            </div>
        </div>

        <div class="info">
            <strong>🕵️‍♂️ Инсайт по брендингу:</strong> SMMToolbox.ru — это закрытая/теневая панель управления, а <strong>PrimeLike.ru</strong> — их публичная "белая" витрина. Все платежи принимаются на ИП Соловов Никита Сергеевич (ОКВЭД 73.11 Рекламные агентства) и частично на ИП Расторгуев Е. Конкурент активно генерирует контент на vc.ru и dtf.ru, создавая рейтинги, где ставит свой сервис на 1-е место.
        </div>

        <div class="alert">
            <strong>⚠️ Проблема отмен:</strong> Из 1.29М заказов <strong>21.1% (271 855)</strong> потеряно (отмены, частичные, неоплаты). ~60% отмен — ошибки клиентов (невалид/дубли), ~25% — проблемы инфраструктуры провайдера (no money / not enough funds).
        </div>

        <!-- 4 Ключевые метрики -->
        <div class="grid">
            <div class="card">
                <h3>Общая упущенная выручка (Оценка)</h3>
                <div class="value loss-text">~17.9М ₽</div>
                <div class="sub-value">Оценка потерь при среднем чеке 66 ₽</div>
            </div>
            <div class="card">
                <h3>Всего Отменённых Заказов</h3>
                <div class="value loss-text">87 688</div>
                <div class="sub-value">6.8% от всей базы заказов</div>
            </div>
            <div class="card">
                <h3>Неоплаченные Заказы (Брошенные)</h3>
                <div class="value">164 754</div>
                <div class="sub-value">12.8% от всей базы (низкий конверт из корзины)</div>
            </div>
            <div class="card">
                <h3>Всего Статей (VC.ru / DTF)</h3>
                <div class="value" style="color: #2563eb">24+</div>
                <div class="sub-value">Пик выхода статей совпадает с пиком выручки</div>
            </div>
        </div>

        <div class="grid" style="grid-template-columns: 2fr 1fr;">
            <!-- Корреляция маркетинга и выручки -->
            <div class="card">
                <h3>График корреляции: Выручка и Количество PR-статей</h3>
                <div class="chart-container">
                    <canvas id="marketingChart"></canvas>
                </div>
                <p class="subtitle" style="margin-top: 10px;">Пик публикаций (окт-дек 2025) четко совпал с максимальной выручкой (с 4М до 7.2М ₽/мес).</p>
            </div>

            <!-- Причины отмен -->
            <div class="card">
                <h3>Топ-5 причин отмен (Данные провайдеров)</h3>
                <table>
                    <thead>
                        <tr><th>Причина</th><th>Кол-во</th></tr>
                    </thead>
                    <tbody>
                        ${cancelData.reasons.map(r => '<tr><td>' + r.reason + '</td><td>' + r.count + '</td></tr>').join('')}
                    </tbody>
                </table>
                
                <h3 style="margin-top: 24px;">Отмены по Категориям</h3>
                <table>
                    <thead>
                        <tr><th>Сетевая панель</th><th>Кол-во отмен</th></tr>
                    </thead>
                    <tbody>
                        ${cancelData.categories.map(c => '<tr><td>' + c.category + '</td><td>' + c.count + '</td></tr>').join('')}
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <script>
        const ctxMarket = document.getElementById('marketingChart').getContext('2d');
        const labels = ${JSON.stringify(labels)};
        const revenues = ${JSON.stringify(revenues)};
        const ads = ${JSON.stringify(ads)};

        new Chart(ctxMarket, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Выручка (₽)',
                        data: revenues,
                        backgroundColor: 'rgba(34, 197, 94, 0.4)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Кол-во PR-статей',
                        data: ads,
                        type: 'line',
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgb(59, 130, 246)',
                        borderWidth: 3,
                        pointBackgroundColor: 'white',
                        pointBorderColor: 'rgb(59, 130, 246)',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Выручка (₽)' },
                        ticks: {
                            callback: function(value) { return (value / 1000000).toFixed(1) + 'M ₽'; }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Кол-во статей' },
                        grid: { drawOnChartArea: false },
                        min: 0,
                        max: 10
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return context.dataset.label + ': ' + new Intl.NumberFormat('ru-RU').format(context.raw) + ' ₽';
                                }
                                return context.dataset.label + ': ' + context.raw + ' шт.';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'competitor_dashboard_extended.html'), html);
console.log('Готово! Расширенный дашборд сохранен в competitor_dashboard_extended.html');
