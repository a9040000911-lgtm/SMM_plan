
import { TicketService } from '../src/services/support/ticket.service';
import { prisma } from '../src/lib/prisma';

async function main() {
    const ticket = await prisma.supportTicket.findFirst({
        where: { status: 'OPEN' }
    });

    if (!ticket) {
        console.log('No open tickets found for test.');
        return;
    }

    console.log(`Testing reply to ticket: ${ticket.id}`);

    try {
        const res = await TicketService.sendStaffReply(
            ticket.id,
            "Test reply from diagnostic script",
            "ed4ef5fc-9721-4a06-bdfa-0f5d6b6553b3", // Your admin ID
            "DiagnosticBot"
        );
        console.log('Result:', res);
    } catch (err) {
        console.error('FAILED TO SEND REPLY:', err);
    }
}

main().catch(console.error);
