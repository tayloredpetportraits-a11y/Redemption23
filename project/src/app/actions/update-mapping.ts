
'use server'

import { PrintifySyncService } from '@/lib/printify/sync-service';
import { MOCKUP_CONFIGS } from '@/lib/mockup-config';

export async function updateBlueprintMapping(blueprintId: number, configKey: string) {
    try {
        // Validate configKey exists
        if (!MOCKUP_CONFIGS[configKey]) {
            throw new Error(`Invalid Mockup Config: ${configKey}`);
        }

        // Use the key as display name for now, or humanize it
        const displayName = configKey.charAt(0).toUpperCase() + configKey.slice(1);

        await PrintifySyncService.setBlueprintMapping(blueprintId, configKey, displayName);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
