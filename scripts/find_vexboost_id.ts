import { prisma } from "../src/lib/prisma";

async function main() {
    const providers = await prisma.provider.findMany({
        select: { id: true, name: true }
    });
    console.log(JSON.stringify(providers, null, 2));
}

main();
