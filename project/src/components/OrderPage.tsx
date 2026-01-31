'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, Lock, Download, X, Edit3, Smartphone } from 'lucide-react';
import { updatePaymentStatus } from '@/lib/api/orders';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import JSConfetti from 'js-confetti';
import ReviewModal from './ReviewModal';
import RevisionRequestModal from './RevisionRequestModal';
import ImpactBanner from './ImpactBanner';

interface OrderPageProps {
  order: Order;
  primaryImages: ImageType[];
  upsellImages: ImageType[];
}

export default function OrderPage({ order, primaryImages, upsellImages }: OrderPageProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    primaryImages.find((img) => img.is_selected)?.id || null
  );
  const [confirmed, setConfirmed] = useState(
    primaryImages.some((img) => img.is_selected)
  );
  const [showMockup, setShowMockup] = useState(false);
  const [isPaid, setIsPaid] = useState(order.payment_status === 'paid');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [socialConsent, setSocialConsent] = useState(false);
  const [socialHandle, setSocialHandle] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const handleImageSelect = (imageId: string) => {
    if (!confirmed) {
      setSelectedImageId(imageId);
      setShowMockup(true);
    }
  };

  const handleConfirm = async () => {
    if (!selectedImageId) return;

    try {
      // Use the server-side API to bypass RLS and trigger fulfillment logic
      const response = await fetch(`/api/customer/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedImageId,
          printProduct: order.product_type || 'poster', // Default or use order's product type
          notes: '' // Optional notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm order');
      }

      if (socialConsent || socialHandle) {
        await fetch(`/api/orders/${order.id}/social`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            social_consent: socialConsent,
            social_handle: socialHandle || null,
          }),
        });
      }

      const jsConfetti = new JSConfetti();
      jsConfetti.addConfetti({
        emojis: ['🐶', '🐱', '🦴', '🐾'],
        confettiNumber: 100,
      });

      setConfirmed(true);
      setShowMockup(false);

      setTimeout(() => {
        setShowReviewModal(true);
      }, 1000);
    } catch (error) {
      console.error('Confirmation error:', error);
      alert('Failed to confirm selection. Please try again.');
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);

    setTimeout(async () => {
      try {
        await updatePaymentStatus(order.id, 'paid');
        setIsPaid(true);
        setShowPaymentModal(false);
      } catch {
        alert('Payment failed. Please try again.');
      } finally {
        setPaymentLoading(false);
      }
    }, 2000);
  };

  const handleDownload = async (image: ImageType) => {
    const response = await fetch(image.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-${image.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleWallpaperDownload = async (image: ImageType) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = image.url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set wallpaper dimensions (9:16 ratio)
      canvas.width = 1080;
      canvas.height = 1920;

      // Calculate crop (center the image)
      const sourceAspect = img.width / img.height;
      const targetAspect = 9 / 16;

      let sx, sy, sWidth, sHeight;

      if (sourceAspect > targetAspect) {
        // Image is wider, crop sides
        sHeight = img.height;
        sWidth = sHeight * targetAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        // Image is taller, crop top/bottom
        sWidth = img.width;
        sHeight = sWidth / targetAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const petName = order.pet_name || 'Pet';
        const themeName = image.theme_name || 'Portrait';
        a.download = `${petName}_${themeName}_Wallpaper.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error creating wallpaper:', error);
      alert('Failed to create wallpaper. Please try downloading the full image.');
    }
  };

  const handleReviewSubmit = async (rating: number, reviewText: string) => {
    try {
      await fetch(`/api/orders/${order.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: reviewText }),
      });
      setShowReviewModal(false);
      setTimeout(() => {
        document.getElementById('upsell-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch {
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleReviewSkip = () => {
    setShowReviewModal(false);
    setTimeout(() => {
      document.getElementById('upsell-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleRevisionSubmit = async (notes: string) => {
    try {
      await fetch(`/api/orders/${order.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision_notes: notes, revision_status: 'requested' }),
      });
      setShowRevisionModal(false);
      alert('Revision request submitted! Our team will review it shortly.');
    } catch {
      alert('Failed to submit revision request. Please try again.');
    }
  };

  const selectedImage = primaryImages.find((img) => img.id === selectedImageId);

  return (
    <div className="min-h-screen">
      <ImpactBanner />
      <div className="px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h1>Welcome, {order.customer_name}!</h1>
            <p className="text-zinc-400 text-lg">
              Your {order.product_type} is ready
            </p>
          </div>

          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h2>Choose Your Print</h2>
              <p className="text-zinc-400">
                Select the image you&apos;d like to receive
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {primaryImages.map((image) => (
                <motion.div
                  key={image.id}
                  whileHover={{ y: confirmed ? 0 : -8 }}
                  onClick={() => handleImageSelect(image.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${selectedImageId === image.id
                    ? 'ring-4 ring-[#7C3AED]'
                    : confirmed
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:ring-2 ring-zinc-700'
                    }`}
                >
                  <Image
                    src={image.url}
                    alt="Option"
                    fill
                    className="object-cover"
                  />
                  {selectedImageId === image.id && (
                    <div className="absolute inset-0 bg-[#7C3AED]/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-[#7C3AED] rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {selectedImageId && !confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <button onClick={handleConfirm} className="btn-primary rounded-lg">
                  Confirm This Print
                </button>
              </motion.div>
            )}

            {confirmed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 rounded-lg text-center space-y-2"
              >
                <Check className="w-12 h-12 mx-auto text-green-400" />
                <p className="text-zinc-300">
                  Your selection has been confirmed! Scroll down for bonus images.
                </p>
              </motion.div>
            )}

            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Need changes? Request a revision
                </button>
              </motion.div>
            )}
          </section>

          <section id="upsell-section" className="space-y-8">
            <div className="text-center space-y-2">
              <h2>Unlock Bonus Collection</h2>
              <p className="text-zinc-400">
                Get all {upsellImages.length} additional images for just $15
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {upsellImages.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <Image
                    src={image.url}
                    alt="Bonus"
                    fill
                    className={`object-cover transition-all ${isPaid ? '' : 'blur-sm grayscale'
                      }`}
                  />

                  {!isPaid ? (
                    <div
                      onClick={() => setShowPaymentModal(true)}
                      className="absolute inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                    >
                      <div className="text-center space-y-2 transform transition-transform group-hover:scale-105">
                        <div className="bg-black/20 p-3 rounded-full inline-block backdrop-blur-sm">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white font-bold text-lg drop-shadow-md px-2">
                          Unlock for $15
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                      <button
                        onClick={() => handleDownload(image)}
                        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-zinc-200 transition-colors w-full justify-center"
                      >
                        <Download className="w-4 h-4" />
                        Download HD
                      </button>
                      <button
                        onClick={() => handleWallpaperDownload(image)}
                        className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-full font-medium hover:bg-zinc-700 transition-colors w-full justify-center"
                      >
                        <Smartphone className="w-4 h-4" />
                        Phone Wallpaper
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isPaid ? (
              <div className="text-center">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary rounded-lg text-lg px-8 py-4"
                >
                  Unlock All {upsellImages.length} Images for $15
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 rounded-lg text-center space-y-2"
              >
                <Check className="w-12 h-12 mx-auto text-green-400" />
                <p className="text-zinc-300">
                  All images unlocked! Click any image to download.
                </p>
              </motion.div>
            )}
          </section>
        </div>

        <AnimatePresence>
          {showMockup && selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowMockup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowMockup(false)}
                  className="absolute top-4 right-4 w-12 h-12 bg-zinc-900/90 rounded-full flex items-center justify-center z-10 hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden">
                  <Image
                    src="https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1920"
                    alt="Living Room"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] aspect-square shadow-2xl">
                    <Image
                      src={selectedImage.url}
                      alt="Your print"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="text-center mt-6 space-y-6">
                  <p className="text-xl text-zinc-100">How it looks on your wall</p>

                  <div className="bg-zinc-900/50 rounded-lg p-6 space-y-4 text-left max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="socialConsent"
                        checked={socialConsent}
                        onChange={(e) => setSocialConsent(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-zinc-700 text-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                      <label htmlFor="socialConsent" className="text-sm text-zinc-300 cursor-pointer">
                        Can we feature your pet on social media? We&apos;d love to share your beautiful portrait with our community!
                      </label>
                    </div>

                    {socialConsent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label htmlFor="socialHandle" className="block text-sm text-zinc-300">
                          Instagram Handle (Optional)
                        </label>
                        <input
                          type="text"
                          id="socialHandle"
                          value={socialHandle}
                          onChange={(e) => setSocialHandle(e.target.value)}
                          placeholder="@yourhandle"
                          className="w-full px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                        />
                      </motion.div>
                    )}
                  </div>

                  <button onClick={handleConfirm} className="btn-primary rounded-lg">
                    Confirm This Print
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => !paymentLoading && setShowPaymentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-8 rounded-lg max-w-md w-full space-y-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center space-y-2">
                  <h2>Complete Purchase</h2>
                  <p className="text-zinc-400">Unlock all {upsellImages.length} bonus images</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2">Name on Card</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2">Card Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-300 mb-2">Expiry</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-300 mb-2">CVC</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={paymentLoading}
                    className="btn-secondary rounded-lg flex-1 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="btn-primary rounded-lg flex-1 disabled:opacity-50"
                  >
                    {paymentLoading ? 'Processing...' : 'Pay $15'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
          onSkip={handleReviewSkip}
        />

        <RevisionRequestModal
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          onSubmit={handleRevisionSubmit}
        />
      </div>
    </div>
  );
}
