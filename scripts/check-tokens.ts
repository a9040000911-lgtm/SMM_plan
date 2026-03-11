
import { prisma } from '../src/lib/prisma';
import axios from 'axios';

async function checkTokens() {
    const projects = await prisma.project.findMany({
        where: { botToken: { not: null } }
    });

    console.log(`Checking ${projects.length} projects...`);

    for (const project of projects) {
        try {
            const response = await axios.get(`https://api.telegram.org/bot${project.botToken}/getMe`);
            console.log(`✅ Project: ${project.name} (@${project.slug}) - Token is VALID. Bot: @${response.data.result.username}`);
        } catch (error: any) {
            console.log(`❌ Project: ${project.name} (@${project.slug}) - Token is INVALID! Error: ${error.response?.status} ${error.response?.statusText}`);
            console.log(`   Token: ${project.botToken}`);
        }
    }
}

checkTokens().catch(console.error);
