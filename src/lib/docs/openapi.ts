/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * OpenAPI 3.1 Specification
 */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Smmplan API',
    version: '1.0.0',
    description: 'API для управления SMM-панелью Smmplan (Март 2026)',
    contact: {
      name: 'Artem Spektr',
      url: 'http://artmspektr.ru',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Main API Gateway',
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Авторизация пользователя',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Успешный вход' },
          401: { description: 'Неверные учетные данные' },
        },
      },
    },
    '/admin/services/import': {
      post: {
        summary: 'Импорт сервисов от провайдера',
        tags: ['Admin', 'Services'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Успешный импорт' },
          429: { description: 'Превышен лимит запросов (Rate Limit)' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
      },
    },
  },
};
