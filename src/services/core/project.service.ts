/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Project } from '@/generated/client';
import { CryptoService } from './crypto.service';

export class ProjectService {
    /**
     * Identifies project by domain (host)
     */
    static async getByDomain(domain: string): Promise<Project | null> {
        const project = await prisma.project.findUnique({
            where: { domain }
        });
        return project ? this.decryptProjectFields(project) : null;
    }

    /**
     * Identifies project by bot token
     */
    static async getByBotToken(botToken: string): Promise<Project | null> {
        const project = await prisma.project.findUnique({
            where: { botToken }
        });
        return project ? this.decryptProjectFields(project) : null;
    }

    /**
     * Gets project by ID
     */
    static async getById(id: string): Promise<Project | null> {
        const project = await prisma.project.findUnique({
            where: { id }
        });
        return project ? this.decryptProjectFields(project) : null;
    }

    /**
     * Gets project by slug
     */
    static async getBySlug(slug: string): Promise<Project | null> {
        const project = await prisma.project.findUnique({
            where: { slug }
        });
        return project ? this.decryptProjectFields(project) : null;
    }

    /**
     * Gets all projects
     */
    static async getAllProjects(): Promise<Project[]> {
        const projects = await prisma.project.findMany({
            orderBy: { name: 'asc' }
        });
        return projects.map(p => this.decryptProjectFields(p));
    }

    /**
     * Ensures a default project exists (for migration/initial setup)
     */
    static async ensureDefaultProject() {
        let project = await prisma.project.findFirst({
            where: { slug: 'default' }
        });

        if (!project) {
            project = await prisma.project.create({
                data: {
                    name: 'Smmplan (Default)',
                    slug: 'default',
                    domain: 'smmplan.ru',
                    botToken: process.env.TELEGRAM_BOT_TOKEN || 'dummy_token',
                    botUsername: 'smmplan_bot',
                    config: {
                        welcomeText: '👋 Добро пожаловать!',
                        referralPercent: 10,
                        minMargin: 15
                    }
                }
            });
            console.log('✅ Default project created');
        }

        return this.decryptProjectFields(project);
    }

    /**
     * Decrypts sensitive JSON fields in the project object
     */
    static decryptProjectFields(project: any): any {
        if (!project) return project;

        // Clone to avoid mutating original if needed
        const decrypted = { ...project };

        if (typeof decrypted.config === 'string') {
            decrypted.config = CryptoService.decryptJson(decrypted.config) || decrypted.config;
        } else if (decrypted.config && typeof decrypted.config === 'object') {
            // If already object, check if it contains encrypted strings or just use as is
        }

        if (typeof decrypted.paymentSettings === 'string') {
            decrypted.paymentSettings = CryptoService.decryptJson(decrypted.paymentSettings) || decrypted.paymentSettings;
        }

        return decrypted;
    }

    /**
     * Checks if a specific feature is enabled for a project
     */
    static async isFeatureEnabled(projectId: string, feature: string): Promise<boolean> {
        const project = await this.getById(projectId);
        if (!project) return false;

        const config = (project.config as any) || {};
        const features = config.features || {};

        const isEnabled = !!features[feature];

        return isEnabled;
    }

    /**
     * Clears project cache (no-op as cache is removed)
     */
    static clearCache() {
        // No-op
    }
}

export enum ProjectFeature {
    GAMIFICATION = 'GAMIFICATION',
    LOYALTY = 'LOYALTY',
    REFERRAL = 'REFERRAL',
    NPS = 'NPS',
    REVIEWS = 'REVIEWS',
    NEWS = 'NEWS'
}
