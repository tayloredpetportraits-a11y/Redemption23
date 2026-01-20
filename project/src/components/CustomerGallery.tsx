'use client';

import { useState, useEffect } from 'react';
import ImageComponent from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Lock, X, AlertCircle, Check, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { flagImageForRevision } from '@/app/actions/image-approval';
import { createCheckoutSession } from '@/app/actions/stripe';
import type { Order, Image as ImageType, ProductTemplate } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

export default function CustomerGallery({
  order,
  baseImages,
  bonusImages: propBonusImages,
  mockupImages,
  upsellImages,
  productTemplates
}: {
  order: Order;
  baseImages: ImageType[];
  bonusImages: ImageType[]; // We might not need this if we slice baseImages, but let's see.
  mockupImages: ImageType[];
  upsellImages: ImageType[];
  productTemplates: ProductTemplate[];
}) {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('payment') === 'success';

  // 1. Data Slicing (As requested)
  // "mainImages = indices 0 to 4"
  // "bonusImages = indices 5 to 9"
  // We assume 'baseImages' contains all the filtered approved images from the parent?
  // Parent filters: "approved, pending, bonus".
  // Let's rely on the passed props but if baseImages has 10, slice it.
  // If 'propBonusImages' are passed separately, use them.
  // The previous prompt said to slice 'images'. 
  // Let's combine base + bonus then slice, OR just assume baseImages has everything?
  // In `page.tsx`, we split distinct lists.
  // Let's use `baseImages` (primary) for the Main 5, and `bonusImages` (bonus) for the upsell.
  // If baseImages is > 5, we should probably check.
  // User Requirement: "Slice the images array... main=0-4, bonus=5-9".
  // This implies all 10 might be in one list.
  // But `page.tsx` splits `baseImages` (is_bonus=false) and `bonusImages` (is_bonus=true).
  // So `baseImages` likely holds the 5 main styles. `bonusImages` holds the 5 extra.
  // We will stick to `baseImages` for Main and `bonusImages` for Bonus.

  // 2. State
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(order.bonus_unlocked || paymentSuccess);

  // Revision State
  const [isReporting, setIsReporting] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // 3. Effects
  useEffect(() => {
    if (paymentSuccess) {
      setIsRevealed(true);
      setIsUnlocked(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [paymentSuccess]);

  // 4. Handlers
  const handleReveal = () => {
    setIsRevealed(true);
    // Fire Confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    // Add Main Images
    const folder = zip.folder(`Taylored-${order.pet_name}`);

    await Promise.all(baseImages.map(async (img, i) => {
      const response = await fetch(img.url);
      const blob = await response.blob();
      folder?.file(`portrait-${i + 1}.png`, blob);
    }));

    if (isUnlocked) {
      await Promise.all(propBonusImages.map(async (img, i) => {
        const response = await fetch(img.url);
        const blob = await response.blob();
        folder?.file(`bonus-${i + 1}.png`, blob);
      }));
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Taylored-Portraits-${order.pet_name}.zip`);
  };

  const handleReportSubmit = async () => {
    if (!selectedImage || !reportText) return;
    setReportStatus('submitting');
    try {
      await flagImageForRevision(selectedImage.id, reportText);
      setReportStatus('success');
      setTimeout(() => {
        setReportStatus('idle');
        setIsReporting(false);
        setReportText('');
      }, 2000);
    } catch (e) {
      alert("Failed to report issue.");
      setReportStatus('idle');
    }
  };

  const handleUnlock = async () => {
    await createCheckoutSession(order.id);
  };

  // 5. Views

  // REVEAL VIEW
  if (!isRevealed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-white">
        <div className="relative w-40 h-40 mb-8">
          <div className="absolute inset-0 bg-brand-blue/20 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
            <ImageComponent src="/logo.gif" alt="Logo" fill className="object-cover" unoptimized />
          </div>
        </div>
        <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-4 tracking-tight">It&apos;s Time.</h1>
        <p className="text-zinc-500 mb-10 max-w-lg text-lg">
          {order.pet_name}&apos;s portraits have been crafted with care.
          Ready to see the magic?
        </p>
        <button
          onClick={handleReveal}
          className="group relative bg-zinc-900 text-white px-10 py-5 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-all active:scale-95 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Tap into the Magic <Sparkles className="w-5 h-5" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    );
  }

  // MAIN GALLERY VIEW
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-slate-900 text-white -mt-10 pt-10 pb-20" // Negative margin to pull up under header if needed, strictly dark theme
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* Hero */}
        <div className="text-center mb-16 pt-12 animate-fade-in-up">
          <h2 className="text-5xl font-serif text-white mb-4 tracking-tight">The {order.pet_name} Collection</h2>
          <p className="text-slate-400 mb-8 text-lg font-light">Hand-picked masterpieces, just for you.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleDownloadAll}
              className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <Download className="w-5 h-5" /> Download Full Pack
            </button>
            <button className="border border-slate-700 text-slate-300 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
              📱 Mobile Wallpapers
            </button>
          </div>
        </div>

        {/* Main Grid (Indices 0-4 approx, or 'baseImages') */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 mb-24">
          {baseImages.map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden shadow-2xl"
              onClick={() => setSelectedImage(img)}
            >
              <ImageComponent
                src={img.url}
                alt="Portrait"
                width={800}
                height={1000}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium">View Full</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* BONUS SECTION (Indices 5-9 approx, or 'bonusImages') */}
        <div className="relative py-16 border-t border-slate-800">
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-amber-200 to-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
              Limited Edition
            </div>
            <h3 className="text-3xl font-serif font-bold text-white mb-2">We got a little carried away...</h3>
            <p className="text-slate-400">The AI loved {order.pet_name} so much, we created 5 extra styles.</p>
          </div>

          <div className="relative">
            {/* Grid of Bonus Images */}
            <div className={`columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 transition-all duration-700 ${!isUnlocked ? 'blur-lg opacity-50 grayscale select-none pointer-events-none' : ''}`}>
              {propBonusImages.slice(0, 5).map((img) => (
                <div key={img.id} className="break-inside-avoid relative rounded-2xl overflow-hidden bg-slate-800" onClick={() => isUnlocked && setSelectedImage(img)}>
                  <ImageComponent
                    src={img.url}
                    alt="Bonus"
                    width={800}
                    height={1000}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Lock Overlay (If not unlocked) */}
            {!isUnlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl text-center max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.15)]"
                >
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-blue">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">Unlock the Bonus Pack</h4>
                  <div className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-6">
                    $9 <span className="text-lg text-slate-500 font-sans font-normal">/ one-time</span>
                  </div>
                  <ul className="text-left text-slate-400 text-sm space-y-3 mb-8 px-4">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 5 Additional High-Res Styles</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Instant Download</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Supports the Creator</li>
                  </ul>
                  <button
                    onClick={handleUnlock}
                    className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    Unlock All 5 Images
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 z-50">
              <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col md:flex-row w-full h-full max-w-7xl gap-8 p-4 md:p-10" onClick={e => e.stopPropagation()}>
              {/* Image Container */}
              <div className="flex-1 relative h-[50vh] md:h-full rounded-2xl overflow-hidden shadow-2xl bg-black">
                <ImageComponent
                  src={selectedImage.url}
                  alt="Detail"
                  fill
                  className="object-contain"
                  quality={100}
                />
              </div>

              {/* Info Sidebar */}
              <div className="w-full md:w-80 shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center gap-6">
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">Portrait Details</h3>
                  <p className="text-slate-500 text-sm">Generated for {order.pet_name}</p>
                </div>

                <button
                  onClick={() => window.open(selectedImage.url, '_blank')}
                  className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download
                </button>

                <div className="border-top border-slate-800 h-px w-full bg-slate-800" />

                {/* Report Flow */}
                <div className="space-y-4">
                  {!isReporting ? (
                    <button
                      onClick={() => setIsReporting(true)}
                      className="w-full py-2 text-xs text-slate-500 hover:text-white flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-slate-700 rounded-lg"
                    >
                      <AlertCircle className="w-3 h-3" /> Report an issue
                    </button>
                  ) : (
                    <div className="bg-slate-800 p-4 rounded-xl animate-fade-in">
                      {reportStatus === 'success' ? (
                        <div className="text-green-400 text-sm flex items-center gap-2 font-medium">
                          <Check className="w-4 h-4" /> Sent! We're on it.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-white text-sm font-bold">What needs fixing?</p>
                          <textarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-brand-blue placeholder:text-slate-600"
                            rows={3}
                            placeholder="e.g. Eyes look a bit off..."
                            value={reportText}
                            onChange={e => setReportText(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsReporting(false)}
                              className="flex-1 text-slate-400 text-xs py-2 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleReportSubmit}
                              disabled={reportStatus === 'submitting'}
                              className="flex-1 bg-brand-blue text-white text-xs py-2 rounded-lg font-bold hover:bg-blue-600"
                            >
                              {reportStatus === 'submitting' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Submit'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
