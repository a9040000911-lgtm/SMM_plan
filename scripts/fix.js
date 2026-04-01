const fs = require('fs');
const file = 'src/app/api/client/orders/[id]/route.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /else if \(\['PROCESSING', 'IN_PROGRESS'\]\.includes\(order\.status\) \|\| order\.isDripFeed\) \{([\s\S]*?)return NextResponse\.json\(\{([\s\S]*?)message: 'Заказ уже запущен\. Запрос на отмену отправлен администратору\.'([\s\S]*?)\}\);\s*\}/;

const match = content.match(regex);
if (match) {
    console.log("Found match, replacing...");
    const replacement = `else if (['PROCESSING', 'IN_PROGRESS'].includes(order.status) || order.isDripFeed) {
                const { ProviderService } = await import('@/services/providers/provider.service');
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
            }`;
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Replaced!");
} else {
    console.log("No match found!");
}
