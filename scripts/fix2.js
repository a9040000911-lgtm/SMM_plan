const fs = require('fs');
const file = 'src/app/api/client/orders/[id]/route.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const startIndex = lines.findIndex(line => line.includes('else if ([\'PROCESSING\', \'IN_PROGRESS\'].includes(order.status) || order.isDripFeed) {'));
const endIndex = lines.findIndex(line => line.includes('} else if (body.action === \'REFILL\') {'));

if (startIndex !== -1 && endIndex !== -1) {
    console.log('Found block! Replacing lines ' + startIndex + ' to ' + (endIndex - 1));
    const newContent = `                const { ProviderService } = await import('@/services/providers/provider.service');
                const cancelRes = await ProviderService.cancelOrder(order);

                if (cancelRes.success) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: 'CANCELED',
                            metadata: { ...(order.metadata as Record<string, any> || {}), internalCancelReq: true }
                        }
                    });
                    
                    return NextResponse.json({ success: true, message: 'Запрос на отмену отправлен провайдеру (API). Средства вернутся после подтверждения.' });
                } else {
                    const meta = (order.metadata as Record<string, any>) || {};
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { metadata: { ...meta, cancelRequested: true } }
                    });

                    const { UnifiedNotificationService } = await import('@/services/core/notification.service');
                    await UnifiedNotificationService.notifyAdmin(
                        order.projectId || 'N/A', 
                        \`⚠️ <b>Запрос на отмену от клиента</b>\\nЗаказ: #\${order.id}\\nПользователь ID: \${userId}\\nПровайдер API недоступен/ошибка: \${cancelRes.error}\`
                    ).catch(e => console.error(e));

                    return NextResponse.json({ 
                        success: false, 
                        message: 'API отмена не поддерживается провайдером. Запрос отправлен администратору.' 
                    });
                }
            } else {
                return NextResponse.json({ error: \`Невозможно отменить заказ со статусом \${order.status}\` }, { status: 400 });
            }`;
    lines.splice(startIndex + 1, (endIndex - startIndex) - 1, newContent);
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Successfully updated file.');
} else {
    console.log('Could not find start index ' + startIndex + ' end index ' + endIndex);
}
