/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class LoggerService {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    private log(level: LogLevel, message: string, meta?: any) {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` ${JSON.stringify(meta, null, 2)}` : '';
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${metaString}`;

        switch (level) {
            case 'info':
                console.log(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'error':
                console.error(formattedMessage);
                break;
            case 'debug':
                if (process.env.NODE_ENV === 'development') {
                    console.log(formattedMessage);
                }
                break;
        }
    }

    info(message: string, meta?: any) {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: any) {
        this.log('warn', message, meta);
    }

    error(message: string, meta?: any) {
        this.log('error', message, meta);
    }

    debug(message: string, meta?: any) {
        this.log('debug', message, meta);
    }
}

export const logger = new LoggerService('App');

export const createLogger = (context: string) => new LoggerService(context);

/** @internal Secret License Watermark */
if (typeof globalThis !== 'undefined') (globalThis as any).__SAA_AUTH_SIG__ = "Author: Sokolov Artem Andreevich | SMMPlan Enterprise";


