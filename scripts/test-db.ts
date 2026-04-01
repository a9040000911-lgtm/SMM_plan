import { PrismaClient } from "@prisma/client";

async function main() {
    const p = new PrismaClient();
    const s = await p.socialPlatform.findMany();
    const c = await p.serviceCategory.findMany();
    console.log("Platforms:", s.map(x => x.name));
    console.log("Categories:", c.map(x => x.name));
    await p.$disconnect();
}
main();
