'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getSupportAiSuggestionAction(ticketId: string) {
    try {
        // 1. Fetch ticket, context (messages), and user orders
        const ticketRaw = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        balance: true,
                        createdAt: true,
                        orders: {
                            orderBy: { createdAt: 'desc' },
                            take: 5,
                            select: {
                                id: true,
                                status: true,
                                totalPrice: true,
                                link: true,
                                internalService: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        }) as any;

        if (!ticketRaw) throw new Error('Ticket not found');

        // 2. Prepare context for AI
        const messageHistory = [...ticketRaw.messages]
            .reverse()
            .map((m: any) => `${m.sender}: ${m.text}`)
            .join('\n');

        const orderContext = ticketRaw.user.orders.map((o: any) =>
            `- Order ID: ${o.id}, Service: ${o.internalService?.name}, Status: ${o.status}, Amount: ${o.totalPrice} RUB, Link: ${o.link}`
        ).join('\n');

        const prompt = `
You are a professional support agent for "SMMPlan" (an SMM panel). 
Answer in Russian language. Be polite, helpful, and concise.

CONTEXT:
User: @${ticketRaw.user.username || 'user'}
User Balance: ${ticketRaw.user.balance} RUB
Joined: ${new Date(ticketRaw.user.createdAt).toLocaleDateString()}

USER'S RECENT ORDERS:
${orderContext || 'No orders yet.'}

TICKET SUBJECT: ${ticketRaw.subject}
MESSAGE HISTORY (last 10):
${messageHistory}

TASK:
Based on the message history and order context, suggest a professional reply. 
If the user is asking about a "Pending" or "In Progress" order, explain that it might take some time based on the service description.
If the error is obvious (Canceled/Refilled), offer a manual check or explain the status.
Do not use placeholders like [Name]. Use the real context.

Output ONLY the suggested text of the reply. No conversational filler like "Here is a suggestion:".
`;

        // 3. Generate content
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestion = response.text().trim();

        return { success: true, suggestion };
    } catch (error: any) {
        console.error('AI Generation Detailed Error:', error);
        return { success: false, error: `AI Error: ${error.message || 'Unknown error'}` };
    }
}
