
import { createAdminClient } from '../supabase/server';
import { PrintifyService } from './service';

export class PrintifySyncService {

    /**
     * SYNC ACTION: Fetches all products from Printify and updates the local DB.
     * returns: { added: number, updated: number, errors: string[] }
     */
    static async syncProducts() {
        const supabase = createAdminClient();
        console.log('[SyncService] Starting Product Sync...');

        // 1. Fetch from Printify (Manual fetch implementation since logic was in research script)
        // We reuse logic similar to research_printify_products.ts but integrated here.
        // Ideally PrintifyService should have a getProducts() method. 
        // Let's add it here for now or update PrintifyService. 
        // I'll implement the fetch here to keep it self-contained for this feature.

        const shopId = process.env.PRINTIFY_SHOP_ID;
        const token = process.env.PRINTIFY_API_TOKEN;

        if (!shopId || !token) {
            throw new Error("Missing Printify Env Vars");
        }

        let allProducts: any[] = [];
        let hasMore = true;
        let page = 1;

        try {
            while (hasMore) {
                const response = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=50&page=${page}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Printify API Error: ${await response.text()}`);
                }

                const data = await response.json();
                const products = data.data || [];
                allProducts = [...allProducts, ...products];

                if (data.last_page === page || products.length === 0) {
                    hasMore = false;
                } else {
                    page++;
                }
            }

            console.log(`[SyncService] Fetched ${allProducts.length} products from Printify.`);

            // 2. Upsert into Database
            let addedCount = 0;
            let updatedCount = 0;

            for (const p of allProducts) {
                // Find default image or first image
                const defaultImg = p.images?.find((img: any) => img.is_default) || p.images?.[0];

                const payload = {
                    id: p.id,
                    title: p.title,
                    blueprint_id: p.blueprint_id,
                    print_provider_id: p.print_provider_id,
                    variants: p.variants.map((v: any) => ({ id: v.id, title: v.title, price: v.price })), // Include price
                    is_active: p.visible,
                    image_url: defaultImg ? defaultImg.src : null,
                    last_synced_at: new Date().toISOString()
                };

                const { error: upsertError } = await supabase
                    .from('printify_products')
                    .upsert(payload, { onConflict: 'id' });

                if (upsertError) {
                    console.error(`[SyncService] Failed to upsert product ${p.id}:`, upsertError);
                } else {
                    updatedCount++; // Upsert counts as update usually
                }

                // Optional: Auto-create mapping if we recognize it?
                // For now, keep it simple.
            }

            return { total: allProducts.length, successful: updatedCount };

        } catch (e) {
            console.error('[SyncService] Sync Failed:', e);
            throw e;
        }
    }

    /**
     * Retrieves the Mockup Config Key for a given Blueprint ID.
     * Returns null if no mapping exists.
     */
    static async getMockupConfigKey(blueprintId: number): Promise<string | null> {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('blueprint_mappings')
            .select('mockup_config_key')
            .eq('blueprint_id', blueprintId)
            .single();

        if (error || !data) {
            return null; // No mapping found
        }
        return data.mockup_config_key;
    }


    /**
     * Get all synced products with their mappings
     */
    static async getSyncedProducts() {
        const supabase = createAdminClient();

        // Fetch both products and mappings
        const { data: products } = await supabase
            .from('printify_products')
            .select('*')
            .order('title');

        const { data: mappings } = await supabase
            .from('blueprint_mappings')
            .select('*');

        if (!products) return [];

        return products.map((p: any) => {
            const mapping = mappings?.find((m: any) => m.blueprint_id === p.blueprint_id);
            return {
                ...p,
                mapped_config: mapping?.mockup_config_key || null,
                mapping_display: mapping?.display_name || null
            };
        });
    }

    /**
     * Admin Tool: Create a mapping
     */
    static async setBlueprintMapping(blueprintId: number, configKey: string, displayName?: string) {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('blueprint_mappings')
            .upsert({
                blueprint_id: blueprintId,
                mockup_config_key: configKey,
                display_name: displayName,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }
}
