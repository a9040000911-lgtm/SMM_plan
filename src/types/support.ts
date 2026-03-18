/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
// Shared interfaces for Support System

export type TicketStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type MessageSender = 'USER' | 'STAFF' | 'SYSTEM' | 'INTERNAL';

export interface SupportMessage {
    id: string;
    sender: MessageSender;
    text: string;
    createdAt: string;
    imageUrl?: string;
    isHeader?: boolean;
}

export interface SupportTicket {
    id: string;
    subject: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    messages: SupportMessage[];
    _count: { messages: number };
}

export interface SupportStats {
    total: number;
    open: number;
    pending: number;
    closed: number;
    hasUnread?: boolean;
}

export interface SupportUser {
    id: string;
    username: string | null;
    balance: number | string; // serialized Decimal
    spent: number | string;   // serialized Decimal
    tgId: string;             // serialized BigInt
    createdAt: string;
    stats?: SupportStats;
    lastActivity?: {
        ticketSubject?: string;
        lastMessage?: string;
        lastMessageSender?: MessageSender;
        updatedAt: string;
    };
}

export interface SupportTemplate {
    id: string;
    name: string;
    template: string;
}


