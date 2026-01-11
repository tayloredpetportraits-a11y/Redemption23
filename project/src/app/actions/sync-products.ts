
'use server'

import { PrintifySyncService } from '@/lib/printify/sync-service';

export async function syncPrintifyProducts() {
    try {
        const result = await PrintifySyncService.syncProducts();
        return { success: true, ...result };
    } catch (e: any) {
        console.error('Sync Action Failed:', e);
        return { success: false, error: e.message };
    }
}
