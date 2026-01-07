'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Download,
  Check,
  Lock,
  Sparkles,
  Heart,
  Share2,
  Clock,
  Star,
  Users,
  Archive,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ImageLightbox from './ImageLightbox';
import UpsellFunnel from './UpsellFunnel';
import type { Order, Image as ImageType } from '@/lib/supabase/client';

interface CustomerGalleryProps {
  order: Order;
  baseImages: ImageType[];
  bonusImages: ImageType[];
}

const PRINT_PRODUCTS = [
  { id: 'canvas', name: 'Premium Canvas', price: 49, description: '16x20 gallery-wrapped canvas' },
  { id: 'bear', name: 'Cuddle Bear', price: 34, description: 'Soft plush bear with portrait' },
  { id: 'tumbler', name: 'Travel Tumbler', price: 34, description: '20oz insulated tumbler' },
];

export default function CustomerGallery({ order, baseImages, bonusImages }: CustomerGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    order.selected_image_id || null
  );
  const [printProduct, setPrintProduct] = useState<string>(
    order.selected_print_product || ''
  );
  const [notes, setNotes] = useState<string>(order.customer_notes || '');
  const [bonusUnlocked, setBonusUnlocked] = useState(order.bonus_unlocked || false);
  const [isConfirmed, setIsConfirmed] = useState(!!order.selected_image_id);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showUpsellFunnel, setShowUpsellFunnel] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<Array<{ id: string; url: string }>>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [socialConsent, setSocialConsent] = useState(order.social_consent || false);
  const [socialHandle, setSocialHandle] = useState(order.social_handle || '');
  const [marketingConsent, setMarketingConsent] = useState(order.marketing_consent || false);
  const [consentSaved, setConsentSaved] = useState(false);

  const petName = order.pet_name || order.customer_name;
  const bonusTheme = bonusImages[0]?.theme_name || 'Artistic Style';
  const selectedImage = baseImages.find((img) => img.id === selectedImageId);

  useEffect(() => {
    const trackView = async () => {
      if (!order.viewed_at) {
        await fetch(`/api/customer/${order.id}/track-view`, { method: 'POST' });
      }
    };
    trackView();
  }, [order.id, order.viewed_at]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      setBonusUnlocked(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleImageClick = (images: ImageType[], index: number) => {
    setLightboxImages(images.map((img) => ({ id: img.id, url: img.url })));
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const handleDownload = async (imageId: string, imageName?: string) => {
    const image = [...baseImages, ...bonusImages].find((img) => img.id === imageId);
    if (!image) return;

    const response = await fetch(image.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = imageName || `${petName}_Portrait_${imageId.slice(0, 8)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    await fetch(`/api/customer/${order.id}/track-download`, { method: 'POST' });
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < baseImages.length; i++) {
      await handleDownload(baseImages[i].id, `${petName}_Portrait_${i + 1}.jpg`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handleConfirmSelection = async () => {
    if (!selectedImageId || !printProduct) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/customer/${order.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedImageId,
          printProduct,
          notes,
        }),
      });

      if (response.ok) {
        setIsConfirmed(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          setShowUpsellFunnel(true);
        }, 2000);
      }
    } catch (error) {
      alert('Failed to confirm selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockBonus = async () => {
    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/checkout/bonus-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Failed to create checkout session. Please try again.');
        setCheckoutLoading(false);
      }
    } catch (error) {
      alert('Payment failed. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    const shopifyUrl = `https://tayloredpetportraits.myshopify.com/cart/add?id=${productId}`;
    window.open(shopifyUrl, '_blank');
  };

  const handleShare = async () => {
    const shareText = `Check out ${petName}'s custom pet portrait from Taylored Pet Portraits! 🐾`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${petName}'s Portrait`, text: shareText, url: shareUrl });
        await fetch(`/api/customer/${order.id}/track-share`, { method: 'POST' });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleSaveConsent = async () => {
    try {
      const response = await fetch(`/api/customer/${order.id}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialConsent,
          socialHandle: socialConsent ? socialHandle : null,
          marketingConsent,
        }),
      });

      if (response.ok) {
        setConsentSaved(true);
        setTimeout(() => setConsentSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="glow-text-amber">{petName}'s Custom Portrait Collection</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Your beautiful AI-generated portraits are ready! Download, share, and select your favorite for printing.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Every portrait helps a shelter animal find their forever home</span>
          </div>
        </motion.div>

        <section className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">Your Portrait Collection</h2>
              <p className="text-zinc-400 mt-1">5 high-resolution images included</p>
            </div>
            <button
              onClick={handleDownloadAll}
              className="btn-teal flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Download All 5
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {baseImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div
                  onClick={() => {
                    if (!isConfirmed) setSelectedImageId(image.id);
                    handleImageClick(baseImages, index);
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all cursor-pointer ${
                    !isConfirmed ? 'hover:ring-2 hover:ring-amber-500' : ''
                  } ${
                    selectedImageId === image.id ? 'ring-4 ring-amber-500' : ''
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`${petName} Portrait ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {selectedImageId === image.id && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(image.id, `${petName}_Portrait_${index + 1}.jpg`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download HD
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {!isConfirmed && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-lg space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-zinc-100">Select Your Print</h3>
              <p className="text-zinc-400">Choose one portrait and product for printing</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  Which portrait would you like printed?
                </label>
                <p className="text-xs text-zinc-500">
                  Click any portrait above to select it, then choose your product below
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  Choose Your Product
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                  {PRINT_PRODUCTS.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setPrintProduct(product.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        printProduct === product.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-semibold text-zinc-100">{product.name}</div>
                      <div className="text-sm text-zinc-400 mt-1">{product.description}</div>
                      <div className="text-amber-400 font-bold mt-2">${product.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your print..."
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmSelection}
              disabled={!selectedImageId || !printProduct || loading}
              className="w-full btn-amber rounded-lg py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Confirming...' : 'Confirm My Print Selection'}
            </button>
          </motion.section>
        )}

        {isConfirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-lg space-y-6"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-zinc-100">Print Selection Confirmed!</h3>
              <p className="text-zinc-400">
                Your {PRINT_PRODUCTS.find((p) => p.id === printProduct)?.name} ships in 5-7 business days
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4" />
                <span>Processing begins tomorrow</span>
              </div>
            </div>

            {selectedImage && (
              <div className="max-w-md mx-auto">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={selectedImage.url}
                    alt="Selected portrait"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-center text-sm text-zinc-500 mt-4">
                  Your selected portrait of {petName}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {isConfirmed && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-8 rounded-lg space-y-6 border-2 border-amber-500/20"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-full">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-medium text-rose-400">Help Spread the Love</span>
              </div>
              <h3 className="text-zinc-100">Love Your Portraits? Help Us Spread the Word!</h3>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Every share helps us promote shelter adoptions through Taylored to Help
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <label className="flex items-start gap-3 p-4 rounded-lg hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                <input
                  type="checkbox"
                  checked={socialConsent}
                  onChange={(e) => setSocialConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-zinc-200 font-medium group-hover:text-zinc-100">
                    Yes! Feature {petName} on Taylored Pet Portraits social media
                  </p>
                  <p className="text-sm text-zinc-500">
                    We'll showcase your beautiful portrait on Instagram, Facebook, and TikTok. We may tag you to help spread the word!
                  </p>
                </div>
              </label>

              {socialConsent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-8 space-y-2"
                >
                  <label className="block text-sm text-zinc-300">
                    Your Instagram/TikTok handle (optional)
                  </label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="@yourpetname"
                    className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </motion.div>
              )}

              <label className="flex items-start gap-3 p-4 rounded-lg hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-zinc-200 font-medium group-hover:text-zinc-100">
                    Include my pet in testimonials and marketing materials
                  </p>
                  <p className="text-sm text-zinc-500">
                    Help us show real examples and inspire more pet parents
                  </p>
                </div>
              </label>

              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex items-start gap-2 text-xs text-zinc-500">
                  <Users className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <p>
                    <strong className="text-zinc-400">Join 4,000+ pet parents featured!</strong> Your consent helps us show real examples and find more pets their forever homes through Taylored to Help. You can revoke consent anytime by contacting us.
                  </p>
                </div>

                <button
                  onClick={handleSaveConsent}
                  disabled={consentSaved}
                  className="w-full btn-amber rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {consentSaved ? (
                    <>
                      <Check className="w-5 h-5 inline mr-2" />
                      Preferences Saved!
                    </>
                  ) : (
                    'Save My Preferences'
                  )}
                </button>
              </div>
            </div>
          </motion.section>
        )}

        <section className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Exclusive Bonus Theme</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">
              Since you loved your portraits, you'll LOVE {bonusTheme}!
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Get 5 MORE stunning portraits of {petName} in {bonusTheme}. Perfect for phone wallpapers, social media, and gifts!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <Users className="w-4 h-4 text-amber-400" />
                <span><strong className="text-zinc-300">2,847</strong> unlocked this week</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span><strong className="text-zinc-300">4.9/5</strong> customer rating</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-4 h-4 text-amber-400" />
                <span><strong className="text-zinc-300">48 hours</strong> to unlock</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {bonusImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden group">
                  <Image
                    src={bonusUnlocked ? image.url : (image.watermarked_url || image.url)}
                    alt={`Bonus Portrait ${index + 1}`}
                    fill
                    className={`object-cover transition-all ${
                      bonusUnlocked ? '' : 'blur-sm grayscale'
                    }`}
                  />

                  {!bonusUnlocked && (
                    <>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-zinc-400" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-white/40 text-2xl font-bold transform -rotate-12 text-center leading-tight px-2">
                          PREVIEW
                          <br />
                          <span className="text-lg">Unlock $9</span>
                        </div>
                      </div>
                    </>
                  )}

                  {bonusUnlocked && (
                    <button
                      onClick={() => handleDownload(image.id, `${petName}_Bonus_${index + 1}.jpg`)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Download className="w-6 h-6" />
                        <span className="text-sm">Download</span>
                      </div>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {!bonusUnlocked ? (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <button
                  onClick={handleUnlockBonus}
                  disabled={checkoutLoading}
                  className="btn-amber rounded-lg text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-5 h-5 inline mr-2" />
                  {checkoutLoading ? 'Loading Checkout...' : `Unlock ${bonusImages.length} Bonus Portraits for $4.99`}
                </button>
                <p className="text-sm text-zinc-500">One-time purchase • Instant download • 48-hour offer</p>
              </div>

              <div className="glass-card p-6 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-zinc-300 italic">
                      "I got the bonus theme and honestly wish I'd gotten both from the start! The quality is just as amazing and now I have 10 beautiful portraits to choose from."
                    </p>
                    <p className="text-sm text-zinc-500">- Jessica M., verified customer</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6 rounded-lg text-center space-y-2"
            >
              <Check className="w-12 h-12 mx-auto text-green-400" />
              <p className="text-zinc-300">
                🎉 Unlocked! All bonus images ready for download. Hover over any image to download.
              </p>
            </motion.div>
          )}
        </section>

        <section className="glass-card p-8 rounded-lg space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-zinc-100">Share the Love</h3>
            <p className="text-zinc-400">Show off {petName}'s amazing portraits on social media!</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleShare} className="btn-teal flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              Share on Social Media
            </button>
          </div>
        </section>
      </div>

      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
          onNavigate={(direction) => {
            if (direction === 'prev' && lightboxIndex > 0) {
              setLightboxIndex(lightboxIndex - 1);
            } else if (direction === 'next' && lightboxIndex < lightboxImages.length - 1) {
              setLightboxIndex(lightboxIndex + 1);
            }
          }}
          onDownload={handleDownload}
        />
      )}

      {showUpsellFunnel && selectedImage && (
        <UpsellFunnel
          portraitUrl={selectedImage.url}
          petName={petName}
          currentProduct={printProduct}
          onAddToCart={handleAddToCart}
          onDecline={() => setShowUpsellFunnel(false)}
        />
      )}
    </div>
  );
}
