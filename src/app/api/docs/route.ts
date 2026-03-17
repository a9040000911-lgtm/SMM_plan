/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * API Documentation Route using Scalar
 */
import { ApiReference } from '@scalar/nextjs-api-reference';
import { openApiSpec } from '@/lib/docs/openapi';

const config = {
  spec: {
    content: openApiSpec,
  },
  theme: 'purple',
  layout: 'modern',
  // Скрываем заголовок Scalar, чтобы использовать наш кастомный, если нужно
  showSidebar: true,
} as const;

export const GET = ApiReference(config);
