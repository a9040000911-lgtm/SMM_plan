/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { ProviderService } from '@/services/providers/provider.service';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProviderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedAxios.create as jest.Mock).mockReturnValue(mockedAxios);
  });

  test('should throw error if no mapping found for service', async () => {
    (prisma.internalServiceMapping.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.internalServiceMapping.findMany as jest.Mock).mockResolvedValue([]);

    await expect(ProviderService.createOrder({ internalServiceId: 'none' } as any, 100))
      .rejects.toThrow(/No active provider mapping/);
  });

  test('should successfully create order at provider', async () => {
    const mockMapping = {
      providerId: 'test-uuid-vex',
      providerServiceId: '123'
    };
    const mockProvider = {
      id: 'test-uuid-vex',
      name: 'vexboost',
      type: 'vexboost',
      isEnabled: true,
      apiUrl: 'http://api',
      apiKey: 'key'
    };

    (prisma.internalServiceMapping.findFirst as jest.Mock).mockResolvedValue(mockMapping);
    (prisma.internalServiceMapping.findMany as jest.Mock).mockResolvedValue([mockMapping]);
    (prisma.provider.findUnique as jest.Mock).mockResolvedValue(mockProvider);

    mockedAxios.post.mockResolvedValue({
      data: { order: 9999, status: 'success' }
    });

    const mockOrder = {
      id: 'test-order-id',
      link: 'http://test.link',
    };

    const result = await ProviderService.createOrder(mockOrder as any, 100, mockMapping as any);

    expect(result.success).toBe(true);
    expect(result.externalId).toBe('9999');
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  test('should handle provider errors gracefully', async () => {
    const mockMapping = { providerId: 'fail-uuid', providerServiceId: '1' };
    (prisma.provider.findUnique as jest.Mock).mockResolvedValue({
      id: 'fail-uuid',
      name: 'fail',
      type: 'vexboost',
      isEnabled: true,
      apiUrl: 'http://api',
      apiKey: 'key'
    });

    mockedAxios.post.mockRejectedValue({
      message: 'Invalid link',
      response: { data: { error: 'Invalid link' } }
    });

    const result = await ProviderService.createOrder({ link: 'bad' } as any, 100, mockMapping as any);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid link');
  });
});


