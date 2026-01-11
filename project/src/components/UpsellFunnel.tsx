'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, TrendingUp, Mail, ArrowRight, Check } from 'lucide-react';
import { MockupGenerator } from './MockupEngine/MockupGenerator';

import { UPSELL_PRODUCTS, type UpsellProduct } from '@/lib/config';

interface UpsellFunnelProps {
  portraitUrl: string;
  petName: string;
  currentProduct: string | null;
  onAddToCart: (productId: string) => void;
  onDecline: () => void;
}

export default function UpsellFunnel({
  portraitUrl,
  petName,
  currentProduct,
  onAddToCart,
  onDecline
}: UpsellFunnelProps) {
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [showOffer, setShowOffer] = useState(true);
  const [view, setView] = useState<'offer' | 'capture'>('offer');
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const productType = currentProduct || 'digital-only';
  const offers = UPSELL_PRODUCTS[productType] || UPSELL_PRODUCTS['digital-only'];
  const currentOffer = offers[currentOfferIndex];

  if (!showOffer || !currentOffer) return null;

  const handleDecline = () => {
    if (view === 'capture') {
      // User really wants to leave
      setShowOffer(false);
      onDecline();
      return;
    }

    if (currentOfferIndex < offers.length - 1) {
      setCurrentOfferIndex(currentOfferIndex + 1);
    } else {
      // Last offer declined, try to save the sale
      setView('capture');
    }
  };

  const handleAccept = () => {
    onAddToCart(currentOffer.id);
    setShowOffer(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Mock API call - in production this would hit an endpoint
    // await fetch('/api/marketing/save-offer', { method: 'POST', body: JSON.stringify({ email }) });

    setEmailSubmitted(true);
    setTimeout(() => {
      setShowOffer(false);
      onDecline();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={() => { if (!emailSubmitted) handleDecline(); }}
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
              <span className="font-semibold font-playfair">
                {view === 'offer' ? 'Special Offer - Available Now' : 'Wait! Don\'t miss out'}
              </span>
            </div>
            <button
              onClick={() => { setShowOffer(false); onDecline(); }}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-brand-navy" />
            </button>
          </div>

          <div className="p-8">
            {view === 'offer' ? (
              <div className="space-y-8">
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
                        imageUrl={portraitUrl}
                        className="absolute inset-0"
                      />
                    </div>

                    <div className="text-center text-sm text-zinc-500">
                      Your selected portrait of {petName}
                    </div>
                  </div>
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
            ) : (
              <div className="max-w-md mx-auto text-center space-y-6 py-8">
                {!emailSubmitted ? (
                  <>
                    <div className="w-16 h-16 bg-brand-blue/20 text-brand-navy rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-navy font-playfair">Not ready to decide?</h2>
                    <p className="text-zinc-600">
                      Send this <strong>15% OFF coupon</strong> to your email. We&apos;ll save your cart for 24 hours so you don't lose your custom design.
                    </p>

                    <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
                      <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2"
                      >
                        Send Coupon <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    <button
                      onClick={() => { setShowOffer(false); onDecline(); }}
                      className="text-zinc-400 hover:text-zinc-600 text-sm font-medium transition-colors"
                    >
                      No thanks, I&apos;ll pass on this offer
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-navy font-playfair">Coupon Sent!</h2>
                    <p className="text-zinc-600">
                      Check your inbox for your 15% off code. Returning you to your order...
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
