/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { OrderStatus } from '@/services/types';

/**
 * Возвращает понятное русское название для статуса заказа.
 * Используется в интерфейсе клиента и админ-панели.
 */
export function getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
        case 'PENDING':
            return 'Ожидает обработки';
        case 'PROCESSING':
            return 'В очереди';
        case 'IN_PROGRESS':
            return 'Выполняется';
        case 'COMPLETED':
            return 'Завершено';
        case 'PARTIAL':
            return 'Выполнено частично';
        case 'CANCELED':
            return 'Отменено';
        default:
            return status;
    }
}

/**
 * Возвращает цвет для статуса (для Tailwind или inline-styles)
 */
export function getOrderStatusColor(status: OrderStatus): string {
    switch (status) {
        case 'PENDING':
            return '#6b7280'; // Gray
        case 'PROCESSING':
            return '#3b82f6'; // Blue
        case 'IN_PROGRESS':
            return '#8b5cf6'; // Violet
        case 'COMPLETED':
            return '#10b981'; // Green
        case 'PARTIAL':
            return '#f59e0b'; // Amber
        case 'CANCELED':
            return '#ef4444'; // Red
        default:
            return '#000000';
    }
}

/**
 * Возвращает русское название для категории (активности) услуги.
 */
export function getActivityLabel(category: string): string {
    const map: Record<string, string> = {
        'SUBSCRIBERS': 'Подписчики',
        'GROUPS': 'Группы / Чаты',
        'LIKES': 'Лайки',
        'VIEWS': 'Просмотры',
        'COMMENTS': 'Комментарии',
        'REACTIONS': 'Реакции',
        'REPOSTS': 'Репосты',
        'BOOSTS': 'Бусты',
        'POLLS': 'Опросы / Голоса',
        'STORIES': 'Истории / Сториз',
        'BOTS': 'Боты',
        'REFERRALS': 'Рефералы',
        'FRIENDS': 'Друзья',
        'PLAYS': 'Прослушивания',
        'TRAFFIC': 'Трафик',
        'DISLIKES': 'Дизлайки',
        'STARS': 'Звезды',
        'WATCH_TIME': 'Часы просмотра',
        'SAVES': 'Сохранения',
        'PREMIUM': 'Премиум',
        'STREAMS': 'Стримы / Зрители',
        'OTHER': 'Другое'
    };

    return map[category.toUpperCase()] || category;
}

/**
 * Переводит типовые текстовые ошибки SMM-провайдеров на русский язык для вывода в Админке
 */
export function translateProviderError(rawError: string | undefined | null): string {
    if (!rawError) return '';

    const lowerError = rawError.toLowerCase();

    // Финансовые ошибки (У провайдера нет денег на балансе)
    if (lowerError.includes('insufficient_funds') || lowerError.includes('not enough money') || lowerError.includes('balance')) {
        return 'Недостаточно средств на балансе API провайдера';
    }

    // Лимиты заказа
    if (lowerError.includes('quantity is too high') || lowerError.includes('max')) {
        return 'Указано количество выше системного максимума провайдера';
    }
    if (lowerError.includes('quantity is too low') || lowerError.includes('min')) {
        return 'Указано количество ниже системного минимума провайдера';
    }

    // Состояние ссылок и дубликаты
    if (lowerError.includes('invalid link') || lowerError.includes('wrong link')) {
        return 'Провайдер отклонил ссылку (неверный формат)';
    }
    if (lowerError.includes('link duplicated') || lowerError.includes('order exists') || lowerError.includes('already in progress') || lowerError.includes('overlap')) {
        return 'Эта ссылка уже используется в другом активном заказе у провайдера';
    }

    // Ошибки конфигурации
    if (lowerError.includes('service not found') || lowerError.includes('invalid service')) {
        return 'Услуга отключена или не существует на стороне провайдера';
    }
    if (lowerError.includes('all providers failed') || lowerError.includes('no active provider mappings found')) {
        return 'Маршрутизация не удалась: нет доступных рабочих провайдеров для этой услуги';
    }

    // Fallback: возвращаем оригинал, если неизвестная ошибка
    return rawError;
}


