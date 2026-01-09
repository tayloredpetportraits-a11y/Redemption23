
export interface PrintifyProductConfig {
    blueprint_id: number;
    print_provider_id: number;
    variant_id: number;
}

// TODO: Replace these placeholders with REAL IDs from your Printify Catalog
export const PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductConfig> = {
    // Canvas Results
    'canvas': {
        blueprint_id: 1234,
        print_provider_id: 29,
        variant_id: 45678
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
        blueprint_id: 1234,
        print_provider_id: 29,
        variant_id: 45678
    },
    // Digital Only - No Printify
    'digital': {
        blueprint_id: 0,
        print_provider_id: 0,
        variant_id: 0
    }
};
