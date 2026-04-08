const { prisma } = require('./src/lib/prisma');
async function test() {
    const project = await prisma.project.findFirst({ orderBy: { createdAt: 'asc' }});
    console.log("Found project domain:", project?.domain);
    const domain = project?.domain || 'localhost';

    const res = await fetch('http://localhost:3000/api/client/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'host': domain },
        body: JSON.stringify({ serviceId: 'e2e-srv-1', link: 'https://test', quantity: 500, email: 'test123456789@smmplan.pro' })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response starts with:", text.substring(0, 300));
}
test().finally(() => process.exit(0));
