'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { GuaranteeParser } from '@/utils/guarantee-parser';

export async function parseGuaranteeAction(text: string) {
    return GuaranteeParser.parse(text);
}
