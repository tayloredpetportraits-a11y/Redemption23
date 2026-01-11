
export interface PrintifyProductConfig {
    blueprint_id: number;
    print_provider_id: number;
    variant_id: number;
}

// TODO: Replace these placeholders with REAL IDs from your Printify Catalog
export const PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductConfig> = {
    // Canvas Results
    'canvas': {
        blueprint_id: 555,
        print_provider_id: 69,
        variant_id: 70882 // 11x14
    },
    // Bear
    'bear': {
        blueprint_id: 9999,
        print_provider_id: 10,
        variant_id: 88888
    },
    // Tumbler (Mapped to Test Mug for Verification)
    'tumbler': {
        blueprint_id: 68,       // Mug
        print_provider_id: 16,  // Spoke Custom
        variant_id: 13398       // 11oz Ceramic
    },
    // Specific Sizes if needed
    'canvas-11x14': {
        blueprint_id: 1159,     // Matte Canvas, Stretched, 1.25"
        print_provider_id: 105, // Jondo
        variant_id: 91641       // 11″ x 14″ (Vertical) / 1.25"
    },
    'canvas-16x20': {
        blueprint_id: 1159,     // Matte Canvas, Stretched, 1.25"
        print_provider_id: 105, // Jondo
        variant_id: 91646       // 16" x 20" (Vertical) / 1.25"
    },
    // Digital Only - No Printify
    'digital': {
        blueprint_id: 0,
        print_provider_id: 0,
        variant_id: 0
    }
};
