/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '../lib/prisma';
import { CryptoService } from '../services/core/crypto.service';

async function main() {
    const token = '8580696545:AAEOttbpfVTmGyQMNHQ5e22WBKpKiBq6zVc';
    const encryptedToken = CryptoService.encrypt(token);

    try {
        const project = await prisma.project.create({
            data: {
                name: 'Test Project',
                slug: 'test',
                domain: 'test.local',
                botToken: encryptedToken,
                brandColor: '#10b981', // Green
                config: {
                    menuLayout: [
                        ['CATALOG', 'BALANCE'],
                        ['SUPPORT']
                    ]
                }
            }
        });

        console.log('Project created successfully:', project.id);
        console.log('Name:', project.name);
        console.log('Slug:', project.slug);
    } catch (e: any) {
        console.error('Error creating project:', e.message);
    }
}

main();
