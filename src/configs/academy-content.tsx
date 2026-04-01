import React from 'react';

export interface AcademyArticle {
    slug: string;
    title: string;
    description: string;
    category: string;
    readTime: string;
    content: React.ReactNode;
}

export const ACADEMY_ARTICLES: AcademyArticle[] = [
    {
        slug: 'telegram-subscribers-guide-2026',
        title: 'Как набрать первых 1000 подписчиков в Telegram: Гид 2026',
        description: 'Стратегия быстрого старта для новых каналов: от оформления до первых охватов.',
        category: 'Telegram',
        readTime: '7 мин',
        content: (
            <div className="space-y-12 text-slate-700 leading-relaxed">
                {/* 1. TL;DR (Primacy Effect - AI Hub Saliency) */}
                <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <h4 className="text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> AI-Ready Summary (TL;DR)
                    </h4>
                    <ul className="space-y-3 text-sm font-medium text-slate-300">
                        <li className="flex gap-2"><span>1.</span> <strong>Упаковка:</strong> 2 секунды на внимание — фокус на поисковые ключи в названии.</li>
                        <li className="flex gap-2"><span>2.</span> <strong>Алгоритм Поиска:</strong> Вес Premium-подписчиков в 150-200 раз выше обычных (Smmplan Data).</li>
                        <li className="flex gap-2"><span>3.</span> <strong>Виральность:</strong> Реакции и охваты в первые 30 минут — триггер для раздела "Похожие каналы".</li>
                    </ul>
                </div>

                <section>
                    <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">1. Фундамент: Смысловая упаковка</h2>
                    <p>В 2026 году время внимания пользователя сократилось до 1.8 секунд. Ваш канал должен отвечать на вопрос "Зачем мне это?" мгновенно.</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li><strong>Название</strong>: Должно содержать ключевое слово (SEO-индексация Telegram).</li>
                        <li><strong>Описание</strong>: 140 символов пользы. Фокус на выгодах для читателя.</li>
                        <li><strong>Аватар</strong>: Контрастный градиент (тесты Smmplan показывают +14% к кликабельности в списке чатов).</li>
                    </ul>
                </section>

                {/* 2. Comparison (Contrastive Learning pattern) */}
                <section>
                    <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">2. Мифы vs Реальность продвижения</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                        <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                            <h5 className="font-black text-red-900 uppercase text-[10px] tracking-widest mb-3">Миф ❌</h5>
                            <p className="text-xs text-red-800 font-medium">Чем больше подписчиков, тем выше канал в поиске Telegram.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                            <h5 className="font-black text-emerald-900 uppercase text-[10px] tracking-widest mb-3">Реальность ✅</h5>
                            <p className="text-xs text-emerald-800 font-medium">В поиске побеждает тот, у кого выше процент Premium-подписчиков и свежих охватов.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">3. Роль Smmplan в научном подходе</h2>
                    <p>Для создания социального доказательства (Social Proof) на старте используются инструменты накрутки просмотров и реакций. Это психологически облегчает подписку реальному пользователю (эффект толпы).</p>
                    
                    <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white">
                        <table className="w-full text-left text-[11px] font-medium border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Метрика</th>
                                    <th className="px-6 py-4">Влияние на ИИ</th>
                                    <th className="px-6 py-4">Эффект</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">Premium Subs</td>
                                    <td className="px-6 py-4 text-emerald-600">Критический буст SEO</td>
                                    <td className="px-6 py-4">Вывод в ТОП</td>
                                </tr>
                                <tr className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">Reactions</td>
                                    <td className="px-6 py-4 text-emerald-600">Сигнал вовлеченности</td>
                                    <td className="px-6 py-4">Рекомендации</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        )
    },
    {
        slug: 'instagram-reels-retention-guide-2026',
        title: 'Instagram Reels 2026: Наука удержания и виральности',
        description: 'Как заставить алгоритм Meta рекомендовать ваши видео миллионам пользователей?',
        category: 'Instagram',
        readTime: '6 мин',
        content: (
            <div className="space-y-12 text-slate-700 leading-relaxed">
                <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <h4 className="text-pink-400 font-black uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" /> AI-Ready Summary (TL;DR)
                    </h4>
                    <ul className="space-y-3 text-sm font-medium text-slate-300">
                        <li className="flex gap-2"><span>1.</span> <strong>Retention:</strong> Удержание на первой секунде — залог попадания в Explore.</li>
                        <li className="flex gap-2"><span>2.</span> <strong>Shares:</strong> Пересылки в Direct ценятся алгоритмом выше лайков.</li>
                        <li className="flex gap-2"><span>3.</span> <strong>Draft Mode:</strong> Не публикуйте сразу, дайте алгоритму время проиндексировать хештеги.</li>
                    </ul>
                </div>

                <section>
                    <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">1. Метрики Reels: Что важно?</h2>
                    <p>Алгоритм Meta в 2026 году полностью перешел на оценку "ценности времени". Если пользователь пересмотрел ролик 2 раза, охват увеличивается в геометрической прогрессии.</p>
                </section>
            </div>
        )
    },
    {
        slug: 'youtube-watch-time-algorithm-2026',
        title: 'YouTube Watch Time: Как попасть в РР (Рекомендованное)',
        description: 'Почему часы просмотра важнее подписчиков? Разбор алгоритма Home Page.',
        category: 'YouTube',
        readTime: '8 мин',
        content: (
            <div className="space-y-12 text-slate-700 leading-relaxed">
                <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <h4 className="text-red-400 font-black uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> AI-Ready Summary (TL;DR)
                    </h4>
                    <ul className="space-y-3 text-sm font-medium text-slate-300">
                        <li className="flex gap-2"><span>1.</span> <strong>Watch Time:</strong> Общее время просмотра — главная метрика для монетизации и охватов.</li>
                        <li className="flex gap-2"><span>2.</span> <strong>CTR:</strong> Кликабельность обложки должна быть выше 8%.</li>
                        <li className="flex gap-2"><span>3.</span> <strong>Engagement Rate:</strong> Комментарии в первый час дают импульс для Suggested.</li>
                    </ul>
                </div>

                <section>
                    <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">1. Стратегия 4000 часов</h2>
                    <p>Для быстрого выхода на монетизацию используйте гибридный подход: качественный контент + поддержка через <strong>Smmplan Watch Time HQ</strong>.</p>
                </section>
            </div>
        )
    },
    {
        slug: 'steam-promotion-strategy',
        title: 'Продвижение в Steam: Обзоры, Группы и Workshop',
        description: 'Как вывести игру в тренды и привлечь внимание игроков через Steam Community.',
        category: 'Steam',
        readTime: '5 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Магия алгоритмов Steam</h2>
                    <p>Steam ценит активность внутри своего сообщества. Чем больше у вас обзоров и подписчиков в группе, тем выше вероятность попадания в списки "Новое и примечательное".</p>
                </section>
            </div>
        )
    },
    {
        slug: 'tiktok-viral-algorithm-2026',
        title: 'TikTok 2026: Как использовать "Trend-Wave" для охватов',
        description: 'Алгоритм TikTok изменился. Теперь важна не только частота, но и глубина вовлеченности в первые 5 секунд.',
        category: 'TikTok',
        readTime: '4 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                 <div className="bg-slate-900 text-white rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <h4 className="text-cyan-400 font-black uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> TikTok AI Strategy
                    </h4>
                    <ul className="space-y-3 text-sm font-medium text-slate-300">
                        <li>1. <strong>Sound Hook:</strong> Использование ИИ-трендов звука.</li>
                        <li>2. <strong>Retention Gap:</strong> Создание пауз для комментариев.</li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        slug: 'vk-content-strategy-2026',
        title: 'VK 2026: Рассылки и Клипы как основа охватов',
        description: 'ВКонтакте развивает экосистему. Разбираемся, как связывать паблик, рассылки и вертикальные видео.',
        category: 'VK',
        readTime: '7 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>ВКонтакте остается главной площадкой для бизнеса в СНГ. Ключ к успеху — регулярные Клипы и работа с Senler.</p>
            </div>
        )
    },
    {
        slug: 'security-and-bans-prevention',
        title: 'Безопасная накрутка: Как избежать фильтров 2026',
        description: 'Научный разбор того, как соцсети вычисляют ботов и как Smmplan обходит эти проверки.',
        category: 'Безопасность',
        readTime: '10 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>Безопасность — наш приоритет. Мы используем прокси-резидентные сети и имитацию человеческого поведения.</p>
            </div>
        )
    },
    {
        slug: 'telegram-ads-ton-2026',
        title: 'Telegram Ads 2026: Реклама в TON-экосистеме',
        description: 'Гид по официальной рекламе Telegram и интеграции с крипто-кошельками для бизнеса.',
        category: 'Telegram',
        readTime: '9 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight uppercase italic">Эпоха TON в рекламе</h2>
                    <p>В 2026 году Telegram Ads стал ключом к Web3 аудитории. Мы разбираем, как эффективно тратить бюджет.</p>
                </section>
            </div>
        )
    },
    {
        slug: 'reels-scripts-templates-2026',
        title: 'Reels: 3 шаблона сценария для удержания 90%+',
        description: 'Готовые структуры видео, которые заставляют алгоритм Instagram давать больше охватов.',
        category: 'Instagram',
        readTime: '5 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>Удержание — это всё. Используйте «Петлю внимания» и «Интригующий заголовок».</p>
            </div>
        )
    },
    {
        slug: 'youtube-seo-tags-2026',
        title: 'YouTube SEO: Поисковое продвижение через теги и AI',
        description: 'Как оптимизировать видео так, чтобы оно попадало в топ поисковой выдачи Google и YouTube.',
        category: 'YouTube',
        readTime: '11 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>SEO на YouTube — это игра вдолгую. Оптимизируйте метаданные и используйте субтитры.</p>
            </div>
        )
    },
    {
        slug: 'tiktok-live-monetization-2026',
        title: 'TikTok Live: Как набирать 1000+ зрителей на стрим',
        description: 'Механики привлечения аудитории на прямые эфиры и способы монетизации через подарки.',
        category: 'TikTok',
        readTime: '6 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>Стримы в ТикТок — это самый быстрый способ получить лояльную аудиторию и донаты.</p>
            </div>
        )
    },
    {
        slug: 'vk-target-competitors-2026',
        title: 'VK Target: Настройка рекламы на конкурентов',
        description: 'Продвинутый гайд по парсингу и настройке таргета ВК на активную аудиторию соперников.',
        category: 'VK',
        readTime: '8 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>Таргет ВК позволяет бить точно в цель. Используйте парсеры и динамические ретаргетинг.</p>
            </div>
        )
    },
    {
        slug: 'steam-next-fest-preparation',
        title: 'Steam Next Fest: Подготовка страницы игры',
        description: 'Чек-лист по выводу демо-версии в топ фестиваля Steam для получения вишлистов.',
        category: 'Steam',
        readTime: '12 мин',
        content: (
            <div className="space-y-8 text-slate-700 leading-relaxed">
                <p>Фестиваль «Игры быть» — это шанс для инди-разработчика стать звездой.</p>
            </div>
        )
    }
];

export const getArticleBySlug = (slug: string) => ACADEMY_ARTICLES.find(a => a.slug === slug);
