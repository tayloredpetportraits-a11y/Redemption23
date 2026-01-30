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
import ProductShowcase from './CustomerGallerySteps/ProductShowcase';
import SocialShareCard from './CustomerGallerySteps/SocialShareCard';
import UpsellFunnel from './UpsellFunnel';
import PrintProofingInterface from './CustomerGallerySteps/PrintProofingInterface';

export default function CustomerGallery({
  order,
  baseImages,
  bonusImages: propBonusImages,
  mockupImages,
  upsellImages,
  productTemplates,
  mobileImages
}: {
  order: Order;
  baseImages: ImageType[];
  bonusImages: ImageType[]; // We might not need this if we slice baseImages, but let's see.
  mockupImages: ImageType[];
  upsellImages: ImageType[];
  productTemplates: ProductTemplate[];
  mobileImages: ImageType[];
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

  // 1. Data Slicing
  // const mobileImages = (upsellImages || []).filter(img => img.type === 'mobile_wallpaper'); (REMOVED - passed as prop)
  // Upsell images should NOT include mobile wallpapers if we want to display them differently?
  // Actually, 'upsellImages' passed from page.tsx filters by type='upsell'.
  // Mobile wallpapers are type='mobile_wallpaper'.
  // We need to make sure page.tsx passes them or we filter them from 'bonusImages' if they were mixed.
  // In generation.ts, we pushed them as separate items.
  // In `page.tsx`, we need to make sure we catch them.
  // Let's assume page.tsx needs an update to pass `mobileImages` or we filter from a "all images" prop if available.
  // Wait, `page.tsx` filters:
  // const upsellImages = (images || []).filter((img: Image) => img.type === 'upsell');
  // It misses 'mobile_wallpaper'.
  // We should update page.tsx first to pass `mobileImages`.
  // BUT, for now, let's look at `page.tsx` again.
  // It passed `upsellImages`.
  // I will assume for this step I am modifying CustomerGallery to Accept a new prop `mobileImages`
  // AND I will update page.tsx to pass it.

  // Let's stick to the prompt: Update CustomerGallery.
  // I will add `mobileImages` to props.

  const [isRevealed, setIsRevealed] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(order.bonus_unlocked || paymentSuccess);

  // Revision State
  const [isReporting, setIsReporting] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Upsell State
  const [showUpsell, setShowUpsell] = useState(false);

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

    // Trigger Upsell if revealed and digital order (and hasn't converted yet)
    if (isRevealed && !order.selected_print_product && !order.upsell_conversion) {
      // Small delay for effect
      const timer = setTimeout(() => setShowUpsell(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, isRevealed, order.selected_print_product, order.upsell_conversion]);

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

    // Exclude mobile wallpapers from this zip
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

  const handleMobileDownload = async () => {
    // Download distinct mobile wallpapers if available
    // Strategy: If we have explicit mobile wallpapers, zip them OR just download the best one?
    // User said: "download all... don't download his mobile wallpaper where we just kind of crop them... The bonus themes need to be locked..."
    // Wait, user said: "Don't download his mobile wallpaper where we just kind of crop them for mobile" in the context of "download all".
    // But implies they SHOULD be downloadable separately? "Download All" vs "Mobile Wallpapers" button.
    // The UI has a "Mobile Wallpapers" button.

    // Note: I will need to use the `mobileImages` prop I am about to add.
    if (!mobileImages || mobileImages.length === 0) {
      // Fallback: Generate on the fly? No, we generated them. 
      alert("No mobile wallpapers found.");
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(`Taylored-${order.pet_name}-Mobile`);

    await Promise.all(mobileImages.map(async (img, i) => {
      const response = await fetch(img.url);
      const blob = await response.blob();
      folder?.file(`wallpaper-${i + 1}.jpg`, blob);
    }));

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Taylored-Mobile-${order.pet_name}.zip`);
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

  // PRINT PROOFING GATES (Logic: Physical Product + No Selection Made Yet)
  // If product is NOT digital-only AND we haven't selected an image yet
  // We force them into the "Select Your Favorite" flow.
  // (Removed Reveal Splash Screen - Instant Access)
  // if (!isRevealed) { ... }

  // (Removed PrintProofingInterface Gate - "Value First" Flow) 
  // We now show the gallery directly.


  // MAIN GALLERY VIEW
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-slate-900 text-white -mt-10 pt-10 pb-20"
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* Hero */}
        <div className="text-center mb-16 pt-12 animate-fade-in-up">
          <h2 className="text-5xl font-serif text-white mb-4 tracking-tight">The {order.pet_name} Collection</h2>
          <p className="text-slate-400 mb-8 text-lg font-light">Hand-picked masterpieces, ready for you.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleDownloadAll}
              className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <Download className="w-5 h-5" /> Download Full Pack
            </button>
            <button
              onClick={handleMobileDownload}
              className="border border-slate-700 text-slate-300 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
              📱 Mobile Wallpapers
            </button>
          </div>
        </div>

        {/* Main Grid (Indices 0-4 approx, or 'baseImages') */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 mb-24">
          {baseImages.map((img, index) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <Download className="w-4 h-4" /> Download / Customize
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Product Showcase (Merch) */}
        {baseImages.length > 0 && productTemplates.length > 0 && (
          <ProductShowcase
            images={baseImages}
            templates={productTemplates}
          />
        )}
      </div>

      {/* LIGHTBOX (Selection & Upsell) */}
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

              {/* Info Sidebar (The Core Flow) */}
              <div className="w-full md:w-96 shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto max-h-full">

                {/* 1. VALUE: Instant Download */}
                <div>
                  <h3 className="text-white font-serif font-bold text-2xl mb-2">Download Portrait</h3>
                  <p className="text-slate-400 text-sm mb-4">High-resolution file, perfect for sharing.</p>

                  <button
                    onClick={() => window.open(selectedImage.url, '_blank')}
                    className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-lg mb-2"
                  >
                    <Download className="w-5 h-5" /> Download High-Res
                  </button>
                  <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest">Instant Access</p>
                </div>

                <div className="border-t border-slate-800 my-2" />

                {/* 2. UPSELL: Canvas Upgrade */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-brand-blue/20 to-transparent w-full h-full pointer-events-none" />

                  <h4 className="text-brand-blue font-bold text-lg mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Turn this into Art?
                  </h4>
                  <p className="text-slate-400 text-sm mb-4">Get this specific portrait printed on museum-quality canvas.</p>

                  {/* Mockup Preview (from upsellImages if available) */}
                  <div className="relative w-full aspect-square bg-slate-900 rounded-lg mb-4 overflow-hidden shadow-inner">
                    {/* Try to find a mockup for this image if possible, or generic */}
                    {/* For now, just show a placeholder or one of the upsell images? 
                         Ideally we match order of selectedImage or just show specific mockup from upsellImages array */}
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs text-center p-4">
                      (Preview of {order.pet_name} on Canvas)
                    </div>
                    {upsellImages && upsellImages.length > 0 && (
                      <ImageComponent
                        src={upsellImages[0].url}
                        fill
                        alt="Canvas Preview"
                        className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      // TODO: Direct to canvas customization with this image
                      // For now, Unlock logic
                      handleUnlock();
                    }}
                    className="w-full bg-brand-blue/10 border border-brand-blue/50 text-brand-blue py-3 rounded-xl font-bold hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    Customize Canvas
                  </button>
                </div>

                {/* Report Link */}
                <div className="pt-4 text-center">
                  <button
                    onClick={() => setIsReporting(true)}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    Issue with this image? Report it.
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div >
  );
}
