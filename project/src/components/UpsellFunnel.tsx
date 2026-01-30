'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, TrendingUp } from 'lucide-react';
import { MockupGenerator } from './MockupEngine/MockupGenerator';

interface UpsellProduct {
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

interface UpsellFunnelProps {
  images: { url: string; id: string }[]; // New prop
  portraitUrl?: string; // KEEP for backward compat if needed, but we'll use images[0] default
  petName: string;
  currentProduct: string | null;
  onAddToCart: (productId: string) => void;
  onDecline: () => void;
}

const UPSELL_PRODUCTS: Record<string, UpsellProduct[]> = {
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

export default function UpsellFunnel({
  images,
  portraitUrl,
  petName,
  currentProduct,
  onAddToCart,
  onDecline
}: UpsellFunnelProps) {
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [showOffer, setShowOffer] = useState(true);

  // Default to first image, either from array or legacy prop
  const [selectedImage, setSelectedImage] = useState<string>(
    (images && images.length > 0) ? images[0].url : (portraitUrl || '')
  );

  const productType = currentProduct || 'digital-only';
  const offers = UPSELL_PRODUCTS[productType] || UPSELL_PRODUCTS['digital-only'];
  const currentOffer = offers[currentOfferIndex];

  if (!showOffer || !currentOffer) return null;

  const handleDecline = () => {
    if (currentOfferIndex < offers.length - 1) {
      setCurrentOfferIndex(currentOfferIndex + 1);
    } else {
      setShowOffer(false);
      onDecline();
    }
  };

  const handleAccept = () => {
    onAddToCart(currentOffer.id);
    setShowOffer(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleDecline}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-brand-navy/20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-brand-navy">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold font-playfair">Special Offer - Available Now</span>
            </div>
            <button
              onClick={handleDecline}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-brand-navy" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  {currentOffer.originalPrice && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <span className="text-sm text-rose-600 font-medium">
                        Limited Time - Save ${currentOffer.originalPrice - currentOffer.price}!
                      </span>
                    </div>
                  )}
                  <h2 className="text-brand-navy font-playfair">{currentOffer.name}</h2>
                  <p className="text-zinc-600 text-lg">{currentOffer.description}</p>
                </div>

                <div className="flex items-baseline gap-3">
                  {currentOffer.originalPrice && (
                    <span className="text-2xl text-zinc-400 line-through">
                      ${currentOffer.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-brand-navy">
                    ${currentOffer.price}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-zinc-700">
                    Turn {petName}&apos;s portrait into:
                  </p>
                  {currentOffer.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-brand-navy/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-brand-navy rounded-full" />
                      </div>
                      <span className="text-zinc-600">{benefit}</span>
                    </div>
                  ))}
                </div>

                {currentOffer.testimonial && (
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-brand-navy text-brand-navy" />
                      ))}
                    </div>
                    <p className="text-zinc-600 italic">&quot;{currentOffer.testimonial}&quot;</p>
                    <p className="text-sm text-zinc-500 font-medium">- {currentOffer.testimonialAuthor}</p>
                  </div>
                )}

                <div className="bg-brand-blue/20 border border-brand-blue/30 rounded-lg p-4">
                  <p className="text-sm text-brand-navy">
                    <strong>4,287 pet parents</strong> upgraded their portraits this month
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="aspect-square bg-zinc-50 rounded-2xl overflow-hidden relative border border-zinc-200">
                  <MockupGenerator
                    productType={currentOffer.mockupType}
                    imageUrl={selectedImage}
                    className="absolute inset-0"
                  />
                </div>

                <div className="text-center text-sm text-zinc-500">
                  Select your favorite portrait to preview
                </div>

                {/* THUMBNAIL SELECTOR */}
                {images && images.length > 1 && (
                  <div className="flex justify-center gap-2 flex-wrap">
                    {images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img.url)}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img.url
                          ? 'border-brand-blue ring-2 ring-brand-blue/20 scale-110'
                          : 'border-zinc-200 opacity-60 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={img.url}
                          alt="Variant"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-100">
                <button
                  onClick={handleAccept}
                  className="btn-primary rounded-xl flex-1 py-4 text-lg shadow-xl"
                >
                  Yes! Add to My Order (${currentOffer.price})
                </button>
                <button
                  onClick={handleDecline}
                  className="btn-secondary rounded-xl px-8 py-4"
                >
                  {currentOfferIndex < offers.length - 1 ? 'Show Me Other Options' : 'No Thanks'}
                </button>
              </div>

              <div className="text-center text-sm text-zinc-400">
                <Clock className="w-4 h-4 inline mr-1" />
                This offer expires when you leave this page
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
