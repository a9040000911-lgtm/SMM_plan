/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { notFound } from 'next/navigation';
import { getClientProjectId } from '@/utils/project-resolver';
import { LegalPageLayout } from '@/components/stitch/legal/LegalPageLayout';
import { CmsService } from '@/services/cms/cms.service';

export const dynamic = 'force-dynamic';
export default async function DynamicLegalPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    const projectId = await getClientProjectId();

    if (!projectId) {
        return notFound();
    }

    const result = await CmsService.getLegalDocument(projectId, slug);
    const document = result.success ? result.data : null;

    if (!document || !document.isActive) {
        // Fallback for missing standard legal documents
        const fallbacks: Record<string, { title: string; content: string }> = {
            'terms': {
                title: 'Пользовательское соглашение',
                content: `
                    <h2>1. Общие положения</h2>
                    <p>Настоящее Пользовательское соглашение регулирует отношения между платформой Smmplan и пользователем услуг. Регистрируясь на сайте, вы подтверждаете свое согласие со всеми условиями документа.</p>
                    <h2>2. Предоставление услуг</h2>
                    <p>Сервис предоставляет инструменты для SMM-продвижения. Мы не гарантируем 100% отсутствие списаний со стороны социальных сетей, однако предоставляем функции гарантии (Refill) для тарифов, где это явно указано.</p>
                    <h2>3. Обязанности пользователя</h2>
                    <p>Запрещается использовать платформу для продвижения контента, нарушающего законодательство РФ, пропагандирующего насилие, мошенничество или содержащего материалы 18+ без соответствующих предупреждений.</p>
                    <h2>4. Возврат средств</h2>
                    <p>Возврат средств с баланса платформы осуществляется по запросу в Службу поддержки после проверки соблюдения правил оказания услуг.</p>
                `
            },
            'privacy': {
                title: 'Политика конфиденциальности',
                content: `
                    <h2>1. Сбор информации</h2>
                    <p>Мы собираем минимально необходимый набор данных для оказания услуг: ваш Email (для уведомлений), IP (для безопасности сессий) и ссылки на социальные сети (для выполнения заказов).</p>
                    <h2>2. Безопасность данных</h2>
                    <p>Все пароли надежно зашифрованы алгоритмом Argon2. Мы никогда не передаем ваши контактные данные третьим лицам без вашего явного согласия.</p>
                    <h2>3. Использование Cookie</h2>
                    <p>Сервис использует файлы cookie для сохранения вашей авторизации и анализа поведения на сайте для улучшения UX (User Experience).</p>
                `
            },
            'offer': {
                title: 'Публичная оферта',
                content: `
                    <h2>1. Предмет договора</h2>
                    <p>Предметом настоящего договора-оферты является предоставление Пользователю доступа к информационно-техническим услугам Платформы на платной или бесплатной основе.</p>
                    <h2>2. Согласие с условиями</h2>
                    <p>Оплата заказа или пополнение внутреннего баланса в Личном Кабинете признается полным и безоговорочным акцептом (принятием) настоящей Оферты.</p>
                    <h2>3. Форс-мажор</h2>
                    <p>Администрация не несет ответственности за невыполнение заказа в связи с глобальными сбоями в работе серверов социальных сетей или изменениями в их алгоритмах фильтрации.</p>
                `
            }
        };

        if (fallbacks[slug]) {
            return (
                <LegalPageLayout
                    title={fallbacks[slug].title}
                    lastUpdated={new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                >
                    <div
                        dangerouslySetInnerHTML={{ __html: fallbacks[slug].content }}
                        className="prose-strong:text-indigo-400 prose-headings:text-slate-900 prose-h2:mb-4 prose-p:mb-8 prose-p:text-slate-600"
                    />
                </LegalPageLayout>
            );
        }

        return notFound();
    }

    return (
        <LegalPageLayout
            title={document.title}
            lastUpdated={new Date(document.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        >
            <div
                dangerouslySetInnerHTML={{ __html: document.content }}
                className="prose-strong:text-indigo-400 prose-headings:text-slate-900 prose-h2:mb-4 prose-p:mb-8 prose-p:text-slate-600"
            />
        </LegalPageLayout>
    );
}
