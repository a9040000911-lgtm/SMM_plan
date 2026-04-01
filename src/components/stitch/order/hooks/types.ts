export interface SmmService {
    id: string;
    numericId?: string;
    name: string;
    description?: string;
    requirements?: string;
    pricePer1000: number;
    category: string;
    platform: string;
    minQty: number;
    maxQty?: number;
    qtyStep?: number;
    targetType?: string;
    isHot?: boolean;
    isCheap?: boolean;
    isBest?: boolean;
    quality?: string;
    isDripFeedDisabled?: boolean;
}

export type ServiceFilter = 'TOP' | 'CHEAP' | 'RU_GEO' | 'FAST' | 'HQ';
