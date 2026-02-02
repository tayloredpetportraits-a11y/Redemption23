
export interface PrintifyProductConfig {
    blueprint_id: number;
    print_provider_id: number;
    variant_id: number;
}

/**
 * Real Printify Blueprint IDs from API
 * 
 * NOTE: Variant IDs are product-specific. The ones below are placeholders.
 * To get exact variant IDs, you must create a product via Printify dashboard
 * and inspect the variant_id from the created product details.
 * 
 * For mockup generation, we'll use the first available variant automatically.
 */
export const PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductConfig> = {
    // Canvas - Classic Canvas (Blueprint 1061, Prima Printing)
    'canvas': {
        blueprint_id: 1061,      // Classic Canvas
        print_provider_id: 66,   // Prima Printing
        variant_id: 55537        // 11x14" (placeholder - update after testing)
    },
    'canvas-11x14': {
        blueprint_id: 1061,      // Classic Canvas
        print_provider_id: 66,   // Prima Printing
        variant_id: 55537        // 11x14" (placeholder - update after testing)
    },
    'canvas-16x20': {
        blueprint_id: 1061,      // Classic Canvas
        print_provider_id: 66,   // Prima Printing
        variant_id: 55538        // 16x20" (placeholder - update after testing)
    },

    // Mug - Ceramic Mug 11oz/15oz (Blueprint 478, Monster Digital)
    'mug': {
        blueprint_id: 478,       // Ceramic Mug (11oz, 15oz)
        print_provider_id: 29,   // Monster Digital
        variant_id: 17188        // 11oz (placeholder - update after testing)
    },

    // Tumbler - Tundra Tumbler 30oz (Blueprint 1662, Chill)
    'tumbler': {
        blueprint_id: 1662,      // Tundra Tumbler 30oz
        print_provider_id: 86,   // Chill
        variant_id: 69097        // 30oz (placeholder - update after testing)
    },

    // Digital Only - No Printify
    'digital': {
        blueprint_id: 0,
        print_provider_id: 0,
        variant_id: 0
    }
};
