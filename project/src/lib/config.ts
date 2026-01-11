import { type ReactNode } from 'react';

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
}

export interface UpsellProduct {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    benefits: string[];
    mockupType: 'canvas' | 'bear' | 'tumbler' | 'blanket';
    testimonial?: string;
    testimonialAuthor?: string;
}

export const PRINT_PRODUCTS: Product[] = [
    { id: 'digital', name: 'Digital Download', price: 0, description: 'High-res file for social media & print' },
    { id: 'canvas-11x14', name: 'Classic Canvas', price: 39, description: '11x14" gallery-wrapped canvas' },
    { id: 'canvas-16x20', name: 'Premium Canvas', price: 59, description: '16x20" gallery-wrapped canvas' },
    { id: 'tumbler', name: 'Travel Tumbler', price: 34, description: '20oz insulated tumbler' },
    { id: 'bear', name: 'Cuddle Bear', price: 34, description: 'Soft plush bear with custom t-shirt' },
];

export const UPSELL_PRODUCTS: Record<string, UpsellProduct[]> = {
    'digital-only': [
        {
            id: 'canvas-large',
            name: 'Premium 16x20 Gallery Canvas',
            price: 59,
            originalPrice: 79,
            description: 'Museum-quality gallery-wrapped canvas',
            benefits: [
                'Perfect for living room or office',
                'Ready to hang - no frame needed',
                'Fade-resistant archival inks',
                'Hand-stretched on premium wood'
            ],
            mockupType: 'canvas',
            testimonial: "The canvas quality blew us away! It's the centerpiece of our living room.",
            testimonialAuthor: 'Sarah M.'
        },
        {
            id: 'canvas-medium',
            name: '11x14 Canvas',
            price: 39,
            originalPrice: 49,
            description: 'Perfect-sized gallery canvas',
            benefits: [
                'Ideal for any room',
                'Gallery-wrapped edges',
                'Professional quality',
                'Ships in 5-7 days'
            ],
            mockupType: 'canvas',
            testimonial: "Perfect size and the quality exceeded expectations!",
            testimonialAuthor: 'Mike R.'
        },
        {
            id: 'bear-tumbler-bundle',
            name: 'Cuddle Bear + Tumbler Bundle',
            price: 65,
            originalPrice: 78,
            description: 'Save $13 with this combo!',
            benefits: [
                'Soft plush bear with portrait',
                '20oz insulated tumbler',
                'Perfect gift combination',
                'Most popular bundle'
            ],
            mockupType: 'bear',
            testimonial: "Got this for my daughter - she carries both everywhere!",
            testimonialAuthor: 'Lisa K.'
        }
    ],
    'canvas': [
        {
            id: 'matching-tumbler',
            name: 'Matching Travel Tumbler',
            price: 34,
            description: 'Complete your collection',
            benefits: [
                'Features your portrait',
                '20oz double-wall insulated',
                'Keeps drinks hot/cold for hours',
                'Perfect for daily use'
            ],
            mockupType: 'tumbler',
            testimonial: "Love having my pup with me on my morning commute!",
            testimonialAuthor: 'Jennifer T.'
        },
        {
            id: 'cuddle-bear',
            name: 'Custom Cuddle Bear',
            price: 34,
            description: 'Adorable plush keepsake',
            benefits: [
                'Ultra-soft premium plush',
                'Portrait printed on shirt',
                'Great gift for kids/grandma',
                'Perfect bedroom companion'
            ],
            mockupType: 'bear',
            testimonial: "My kids fight over who gets to sleep with it!",
            testimonialAuthor: 'Amanda B.'
        }
    ],
    'bear': [
        {
            id: 'upgrade-canvas',
            name: 'Upgrade to Premium Canvas',
            price: 49,
            originalPrice: 59,
            description: 'Turn your favorite into wall art',
            benefits: [
                '11x14 museum-quality canvas',
                'Premium gallery wrap',
                'Complements your bear perfectly',
                'Exclusive bundle discount'
            ],
            mockupType: 'canvas',
            testimonial: "The canvas makes the bear even more special!",
            testimonialAuthor: 'David L.'
        }
    ],
    'tumbler': [
        {
            id: 'upgrade-canvas',
            name: 'Upgrade to Premium Canvas',
            price: 49,
            originalPrice: 59,
            description: 'Display your portrait proudly',
            benefits: [
                '11x14 gallery canvas',
                'Museum-quality printing',
                'Perfect home décor upgrade',
                'Limited time offer'
            ],
            mockupType: 'canvas',
            testimonial: "Should have gotten the canvas from the start!",
            testimonialAuthor: 'Rachel S.'
        }
    ]
};
