'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { TicketStatus, MessageSender } from '@/types/support';
import { cookies } from 'next/headers';

async function getAdminAccess() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) return { isGlobal: false, projectIds: [] };

    const { verifyAdminSession } = await import('@/lib/jwt');
    const adminData = await verifyAdminSession(session.value);
    if (!adminData) return { isGlobal: false, projectIds: [] };
    const admin = await prisma.user.findUnique({
        where: { id: adminData.id },
        include: { accessibleProjects: { select: { id: true } } } as any
    }) as any;

    if (!admin) return { isGlobal: false, projectIds: [] };

    return {
        isGlobal: admin.isGlobalAdmin || admin.role === 'ADMIN',
        projectIds: admin.accessibleProjects.map((p: any) => p.id)
    };
}

export interface UserListItem {
    id: string;
    username: string | null;
    tgId: string;
    balance: string;
    project: {
        name: string;
        color: string;
    } | null;
    stats: {
        open: number;
        pending: number;
        closed: number;
        total: number;
    };
    hasUnread: boolean;
    lastActivity: {
        ticketSubject: string;
        lastMessage: string;
        lastMessageSender: MessageSender;
        updatedAt: string;
    } | null;
}

export interface UserListResponse {
    users: UserListItem[];
    total: number;
    stats: {
        totalUsers: number;
        usersWithOpen: number;
        usersWithPending: number;
    };
}

export async function getUserListAction(
    filter: 'active' | 'all' = 'active',
    search: string = '',
    projectId: string | null = null,
    page: number = 1,
    limit: number = 20
): Promise<UserListResponse & { hasMore: boolean }> {
    const access = await getAdminAccess();
    const skip = (page - 1) * limit;

    // 1. Сначала фильтруем пользователей
    const whereClause = {
        tickets: { some: {} },
        ...(projectId ? { projectId } : (access.isGlobal ? {} : { projectId: { in: access.projectIds } })),
        ...(search ? {
            OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } },
                { tgId: { contains: search, mode: 'insensitive' } },
                ...(/^\d+$/.test(search) ? [{ tickets: { some: { orderId: parseInt(search) } } }] : [])
            ]
        } : {})
    } as any; /* Prisma Types workaround */

    // Для фильтра 'active' нам нужно сначала найти тех, у кого есть активные тикеты
    // Это сложнее сделать одним запросом с пагинацией и сортировкой по активности в тикетах.
    // Упростим:
    // Если фильтр 'active', добавляем условие в whereClause
    if (filter === 'active') {
        whereClause.tickets = {
            some: {
                status: { in: ['OPEN', 'PENDING'] } as any
            }
        };
    }

    // 2. Получаем общее количество для пагинации
    const _totalCount = await prisma.user.count({ where: whereClause });

    // 3. Получаем пользователей с сортировкой по последней активности тикета
    // Prisma не умеет сортировать по "дате обновления связанной сущности" напрямую в findMany легко и эффективно без join'ов или агрегации.
    // Но мы можем сортировать по User.updatedAt если мы обновляем User при обновлении тикета (что не факт).
    // ЛУЧШЕЕ РЕШЕНИЕ ДЛЯ UX: Получать ID пользователей, отсортированные по последнему сообщению/тикету, затем фечить детали.
    // Но для MVP и скорости (учитывая ограничения Prisma):
    // Мы можем, однако, отсортировать по createdAt самого юзера, или...
    // ТЕКУЩАЯ РЕАЛИЗАЦИЯ сортировала в памяти.
    // Чтобы сделать пагинацию, нам НУЖНА сортировка на уровне БД.
    // Вариант: Сортировать по `updatedAt` пользователя (если мы будем его обновлять при активности в тикете).
    // Либо: Мы ищем последние обновленные тикеты и берем их владельцев.

    // Попробуем через поиск тикетов, так как это основная сущность "чата".
    const _tickets = await prisma.supportTicket.findMany({
        where: {
            ...(filter === 'active' ? { status: { in: ['OPEN', 'PENDING'] } } : {}),
            user: {
                ...(projectId ? { projectId } : (access.isGlobal ? {} : { projectId: { in: access.projectIds } })),
                ...(search ? {
                    OR: [
                        { username: { contains: search, mode: 'insensitive' } },
                        { id: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
            userId: true
        },
        distinct: ['userId'] // Уникальные пользователи
    });

    // Из-за distinct + orderBy + pagination в Prisma могут быть нюансы, но distinct по userId сработает.
    // НО: distinct применяется ПОСЛЕ сортировки или ДО? В Postgres distinct on.
    // Если мы хотим "последние активные чаты", нам нужно:
    // Получить уникальные ticket.userId, отсортированные по MAX(ticket.updatedAt) desc.
    // Prisma: findMany с distinct ['userId'] и orderBy updatedAt desc вернет "первый попавшийся" или "последний"?
    // Обычно distinct on берет первую строку. Если мы сортируем по updatedAt desc, то первая строка для юзера будет с самым свежим тикетом.
    // Это то что нужно!

    // Однако, `skip` и `take` с `distinct` могут работать неочевидно.
    // Давайте попробуем подход: Находим ID пользователей через тикеты.

    // ВАЖНО: Если мы используем distinct, totalCount может быть некорректным (он считает строки, а не уникальных юзеров).
    // Придется делать groupBy для точного подсчета, или (проще) - queryRaw, но попробуем Prisma way.

    // Workaround для "Пользователи, отсортированные по дате последнего тикета":
    // 1. Находим UserIds.
    // Т.к. Distinct + Pagination сложная тема, сделаем проще:
    // Будем сортировать просто по наличию новых сообщений (это сложно).
    // ДЛЯ MVP ПАГИНАЦИИ:
    // Просто берем пользователей.
    // НО: пользователь хочет видеть "свежие" сверху.
    // Старый код делал `filteredUsers.sort`.

    // Давайте пойдем через Тикеты, так как это и есть "Чаты".
    const _recentTicketUsers = await prisma.supportTicket.groupBy({
        by: ['userId'],
        where: {
            ...(filter === 'active' ? { status: { in: ['OPEN', 'PENDING'] } } : {}),
            // Добавляем фильтры по юзеру (проекты, поиск) через include/where - но groupBy не поддерживает relation filter deep.
            // Придется сначала найти юзеров, если есть поиск/проект.
        },
        _max: {
            updatedAt: true
        },
        orderBy: {
            _max: {
                updatedAt: 'desc'
            }
        },
        // Сначала фильтруем по юзерам?
        // Если есть search/project, нам нужно ограничить userId in [...foundUserIds]
    });

    // Это становится сложным запросом.
    // Вернемся к простому, но надежному варианту:
    // Грузим пользователей, как раньше, но с лимитом.
    // НО сортировка по "последней активности" требует джойна.

    // КОМПРОМИССНОЕ РЕШЕНИЕ:
    // Ищем `User` и сортируем их по `updatedAt` (предполагая что мы будем обновлять юзера при сообщении).
    // Если сейчас это не так - добавим это в `replyToTicketAction`.
    // Но сейчас, чтобы не ломать логику, используем `Ticket` как источник правды.

    // Получаем список ID тикетов, отсортированных по дате обновления.
    const ticketConditions: any = {};
    if (filter === 'active') ticketConditions.status = { in: ['OPEN', 'PENDING'] };

    const userConditions: any = {};
    if (projectId) userConditions.projectId = projectId;
    else if (!access.isGlobal) userConditions.projectId = { in: access.projectIds };

    if (search) {
        userConditions.OR = [
            { username: { contains: search, mode: 'insensitive' } },
            { id: { contains: search, mode: 'insensitive' } },
            ...(/^\d+$/.test(search) ? [{ tickets: { some: { orderId: parseInt(search) } } }] : [])
        ];
    }

    // Находим тикеты, подходящие под условия
    // Используем findMany с distinct для получения уникальных юзеров
    const userIdsWithTickets = await prisma.supportTicket.findMany({
        where: {
            ...ticketConditions,
            user: userConditions
        },
        orderBy: { updatedAt: 'desc' },
        select: { userId: true },
        distinct: ['userId'],
        skip: skip,
        take: limit
    });

    const targetUserIds = userIdsWithTickets.map(t => t.userId);

    // Теперь получаем полные данные этих юзеров
    const usersWithTickets = await prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        include: {
            project: { select: { name: true, brandColor: true } },
            tickets: {
                select: {
                    id: true,
                    status: true,
                    subject: true,
                    updatedAt: true,
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { text: true, sender: true, createdAt: true }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                // Нам нужны ВСЕ тикеты юзера для статистики? 
                // Старый код считал статистику по ВСЕМ тикетам юзера.
                // Это ОК.
            }
        }
    }) as any[];

    // Сортируем полученных юзеров в том же порядке, что и targetUserIds (т.е. по свежести тикета)
    usersWithTickets.sort((a, b) => {
        return targetUserIds.indexOf(a.id) - targetUserIds.indexOf(b.id);
    });

    const usersWithStats: UserListItem[] = usersWithTickets.map(user => {
        const openCount = user.tickets.filter((t: any) => t.status === 'OPEN').length;
        const pendingCount = user.tickets.filter((t: any) => t.status === 'PENDING').length;
        const closedCount = user.tickets.filter((t: any) => t.status === 'CLOSED').length;
        const lastTicket = user.tickets[0]; // Самый свежий, т.к. orderBy desc
        const lastMessage = lastTicket?.messages[0];
        const hasUnread = lastMessage?.sender === 'USER' && lastTicket?.status !== 'CLOSED';

        return {
            id: user.id,
            username: user.username,
            tgId: user.tgId?.toString() || '',
            balance: user.balance.toString(),
            project: user.project ? {
                name: user.project.name,
                color: user.project.brandColor
            } : null,
            stats: {
                open: openCount,
                pending: pendingCount,
                closed: closedCount,
                total: user.tickets.length
            },
            hasUnread,
            lastActivity: lastTicket ? {
                ticketSubject: lastTicket.subject,
                lastMessage: lastMessage?.text?.substring(0, 100) || '',
                lastMessageSender: (lastMessage?.sender as MessageSender) || 'SYSTEM',
                updatedAt: lastTicket.updatedAt.toISOString()
            } : null
        };
    });

    // Получаем общую статистику (для каунтеров в табах) - это отдельные запросы, чтобы не зависеть от пагинации.
    // Можно закэшировать.
    // Для оптимизации можно делать отдельные count запросы.

    // Подсчет пользователей для таба "Все"
    // (Это тяжелая операция если юзеров миллионы, но пока пойдет)
    // Учитываем фильтры access и search, но НЕ filter='active' (для таба All)
    const allUsersCount = await prisma.user.count({
        where: {
            tickets: { some: {} },
            ...userConditions
        }
    });

    // Подсчет для таба "Active"
    const activeUsersCount = await prisma.user.count({
        where: {
            ...userConditions,
            tickets: { some: { status: { in: ['OPEN', 'PENDING'] } } }
        }
    });

    // Подсчет статистики для ответа (UsersWithOpen/Pending)
    // Это можно сделать приблизительно или отдельным агрегирующим запросом.
    // Старая логика: usersWithStats.filter(...) - работало только на загруженной странице.
    // Сейчас мы не можем посчитать точно без тяжелого запроса.
    // Вернем 0 или сделаем отдельные count.

    const usersWithOpen = await prisma.user.count({
        where: {
            ...userConditions,
            tickets: { some: { status: 'OPEN' } }
        }
    });

    const usersWithPending = await prisma.user.count({
        where: {
            ...userConditions,
            tickets: { some: { status: 'PENDING' } }
        }
    });

    return {
        users: usersWithStats,
        total: filter === 'active' ? activeUsersCount : allUsersCount,
        hasMore: usersWithStats.length === limit,
        stats: {
            totalUsers: allUsersCount,
            usersWithOpen,
            usersWithPending
        }
    };
}

export interface ConversationTicket {
    id: string;
    subject: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
        id: string;
        sender: MessageSender;
        text: string;
        createdAt: string;
        imageUrl?: string;
        voiceUrl?: string;
        staffUsername?: string;
    }>;
}

export interface UserConversation {
    user: {
        id: string;
        username: string | null;
        tgId: string;
        balance: string;
        spent: string;
        createdAt: string;
        project: {
            name: string;
            color: string;
        } | null;
    };
    tickets: ConversationTicket[];
    stats: {
        open: number;
        pending: number;
        closed: number;
    };
}

export async function getUserConversationAction(userId: string): Promise<UserConversation | null> {
    const access = await getAdminAccess();

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            ...(access.isGlobal ? {} : { projectId: { in: access.projectIds } })
        },
        select: {
            id: true,
            username: true,
            tgId: true,
            balance: true,
            spent: true,
            createdAt: true,
            project: {
                select: {
                    name: true,
                    brandColor: true
                }
            },
            tickets: {
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    subject: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        select: {
                            id: true,
                            sender: true,
                            text: true,
                            createdAt: true,
                            imageUrl: true,
                            voiceUrl: true,
                            staffUsername: true
                        }
                    }
                }
            } as any
        } as any
    });

    if (!user) return null;
    const userData = user as any;

    const openCount = userData.tickets.filter((t: any) => t.status === 'OPEN').length;
    const pendingCount = userData.tickets.filter((t: any) => t.status === 'PENDING').length;
    const closedCount = userData.tickets.filter((t: any) => t.status === 'CLOSED').length;

    const sortedTickets = [...userData.tickets].sort((a: any, b: any) => {
        const statusOrder: any = { OPEN: 0, PENDING: 1, CLOSED: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    return {
        user: {
            id: userData.id,
            username: userData.username,
            tgId: userData.tgId?.toString() || '',
            balance: userData.balance.toString(),
            spent: userData.spent.toString(),
            createdAt: userData.createdAt.toISOString(),
            project: userData.project ? {
                name: userData.project.name,
                color: userData.project.brandColor
            } : null
        },
        tickets: sortedTickets.map((t: any) => ({
            id: t.id,
            subject: t.subject,
            status: t.status as TicketStatus,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            messages: t.messages.map((m: any) => ({
                id: m.id,
                sender: m.sender as MessageSender,
                text: m.text,
                createdAt: m.createdAt.toISOString(),
                imageUrl: m.imageUrl || undefined,
                voiceUrl: m.voiceUrl || undefined,
                staffUsername: m.staffUsername || undefined
            }))
        })),
        stats: { open: openCount, pending: pendingCount, closed: closedCount }
    };
}

export async function getTemplatesAndMacrosAction() {
    const [templates, macros] = await Promise.all([
        prisma.supportTemplate.findMany({ orderBy: { updatedAt: 'desc' }, take: 20 }),
        prisma.supportMacro.findMany({ orderBy: { updatedAt: 'desc' }, take: 20 })
    ]);

    return {
        templates: templates.map(t => ({ id: t.id, title: t.title, content: t.content })),
        macros: macros.map(m => ({ id: m.id, name: m.title, actions: m.actions }))
    };
}

export interface UserOrder {
    id: number;
    serviceName: string;
    amount: string;
    status: string;
    createdAt: string;
    link: string;
}

export async function getLatestUserOrdersAction(userId: string): Promise<UserOrder[]> {
    const access = await getAdminAccess();

    // Check permission first
    const userCheck = await prisma.user.findFirst({
        where: {
            id: userId,
            ...(access.isGlobal ? {} : { projectId: { in: access.projectIds } })
        }
    });

    if (!userCheck) return [];

    const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            link: true,
            internalService: {
                select: {
                    name: true
                }
            }
        }
    });

    return orders.map(o => ({
        id: o.id,
        serviceName: o.internalService.name,
        amount: o.totalPrice.toString(),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        link: o.link
    }));
}

export async function getSupportProjectsAction() {
    const access = await getAdminAccess();

    const projects = await prisma.project.findMany({
        where: (access.isGlobal ? {} : { id: { in: access.projectIds } }) as any,
        select: {
            id: true,
            name: true,
            brandColor: true,
            slug: true
        } as any
    }) as any[];

    return projects.map(p => ({
        id: p.id,
        name: p.name,
        color: p.brandColor,
        slug: p.slug
    }));
}
