'use client';

import { useState, useEffect } from 'react';
import ImageComponent from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, Lock, Smartphone, Check, Clock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createCheckoutSession } from '@/app/actions/stripe';
import type { Order, Image as ImageType, ProductTemplate } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import ProductMockup from './ProductMockup';
import RevisionRequestModal from './RevisionRequestModal';

// Product Configuration removed - using order.product_type instead

export default function CustomerGallery({
  order,
  baseImages,
  bonusImages: propBonusImages,
  // mockupImages,
  // upsellImages,
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

  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(order.bonus_unlocked || paymentSuccess);

  // Print Selection State
  const [selectedPortraitIdForPrint, setSelectedPortraitIdForPrint] = useState<string | null>(
    order.selected_image_id || null
  );

  // Revision Request State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedImagesForRevision, setSelectedImagesForRevision] = useState<Set<string>>(new Set());
  const [revisionSubmitted, setRevisionSubmitted] = useState(order.revision_status !== 'none');
  const [loading, setLoading] = useState(false);

  // Helper Functions
  const isDigitalOnly = () => {
    if (!order.product_type) return true;
    const digitalKeywords = ['digital', 'download', 'file'];
    return digitalKeywords.some(keyword =>
      order.product_type!.toLowerCase().includes(keyword)
    );
  };

  const allAvailablePortraits = isUnlocked
    ? [...baseImages, ...propBonusImages]
    : baseImages;

  const toggleImageForRevision = (imageId: string) => {
    const newSet = new Set(selectedImagesForRevision);
    if (newSet.has(imageId)) {
      newSet.delete(imageId);
    } else {
      newSet.add(imageId);
    }
    setSelectedImagesForRevision(newSet);
  };

  // Effects
  useEffect(() => {
    if (paymentSuccess) {
      setIsUnlocked(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [paymentSuccess]);

  // 4. Handlers
  // handleReveal removed

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

  /* const handleReportSubmit = async () => { ... } */

  const handleWallpaperDownload = async (imageUrl: string, imageName: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 9:16 ratio (phone wallpaper)
    canvas.width = 1080;
    canvas.height = 1920;

    // Calculate crop to center the image
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
      const url = URL.createObjectURL(blob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${imageName}_Wallpaper.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  };

  const handleSubmitRevision = async (selectedImageIds: string[], notes: string, referencePhotos?: File[]) => {
    setLoading(true);
    try {
      // TODO: Upload reference photos to Supabase storage if provided
      let referencePhotoUrls: string[] = [];
      if (referencePhotos && referencePhotos.length > 0) {
        console.log('Reference photos to upload:', referencePhotos);
        // We'll implement photo upload in a future update
      }

      // Submit revision request with selected image IDs
      const response = await fetch(`/api/orders/${order.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revision_notes: `Selected portraits: ${selectedImageIds.join(', ')}\n\n${notes}`,
          revision_status: 'requested',
          selected_image_ids: selectedImageIds,
          reference_photo_urls: referencePhotoUrls,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit revision request');

      setRevisionSubmitted(true);
      setShowRevisionModal(false);

      // Show success message
      alert('Revision request submitted! We\'ll review your feedback and send updated portraits within 24-48 hours.');
    } catch (error) {
      console.error('Error submitting revision:', error);
      alert('Failed to submit revision request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockBonus = async () => {
    await createCheckoutSession(order.id);
  };

  const handleConfirmPrintSelection = async () => {
    if (!selectedPortraitIdForPrint) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/customer/${order.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedImageId: selectedPortraitIdForPrint
        }),
      });

      if (!response.ok) throw new Error('Failed to confirm selection');

      // Show success message
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      alert('Print selection confirmed! We\'ll get started on your order.');
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Failed to confirm selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Views

  // --- ORDER STATUS GATEKEEPER ---
  if (order.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="text-center space-y-4 p-8">
          <Clock className="w-16 h-16 mx-auto animate-spin text-amber-500" />
          <h1 className="text-3xl font-bold text-zinc-100">Your Portraits Are Being Created!</h1>
          <p className="text-zinc-400 max-w-md">
            We're putting the finishing touches on your custom portraits.
            You'll receive an email when they're ready (usually within 24-48 hours).
          </p>
        </div>
      </div>
    );
  }

  if (order.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="text-center space-y-4 p-8">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="text-3xl font-bold text-zinc-100">Something Went Wrong</h1>
          <p className="text-zinc-400 max-w-md">
            We encountered an issue creating your portraits.
            Please contact support at support@tayloredpetportraits.com
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN GALLERY VIEW (Only visible when status === 'ready') ---
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-slate-900 text-white -mt-10 pt-10 pb-20"
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl font-serif text-white mb-4 tracking-tight">Your Custom Portraits Are Ready!</h2>
          <p className="text-slate-400 mb-4 text-lg font-light">Download all 5 portraits below. High-resolution files ready for printing and sharing.</p>

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

        {/* SECTION 1: Base Portraits with Revision Selection */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-serif text-white mb-2">Your 5 Custom Portraits</h3>
            <p className="text-slate-400 text-sm md:text-base">Download instantly or view in full screen</p>
            {!revisionSubmitted && (
              <p className="text-amber-400 text-sm mt-2">
                💡 Not happy with a portrait? Select it and request changes below.
              </p>
            )}
          </div>

          {/* Main Grid with Revision Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {baseImages.map((img, index) => (
              <div key={img.id} className="relative group">
                <div
                  className={`relative rounded-lg overflow-hidden ${selectedImagesForRevision.has(img.id)
                    ? 'ring-4 ring-amber-500'
                    : ''
                    }`}
                >
                  <img
                    src={img.url}
                    alt={`Portrait ${index + 1}`}
                    className="w-full aspect-square object-cover cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  />

                  {/* Revision checkbox overlay */}
                  {!revisionSubmitted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleImageForRevision(img.id);
                      }}
                      className="absolute top-2 left-2 w-6 h-6 rounded border-2 border-white bg-black/50 flex items-center justify-center hover:bg-black/70 transition"
                    >
                      {selectedImagesForRevision.has(img.id) && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  )}

                  {/* Download button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(img.url, '_blank');
                    }}
                    className="absolute bottom-2 right-2 p-2 bg-black/70 rounded-full hover:bg-black transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-zinc-500 mt-1">Portrait {index + 1}</p>
              </div>
            ))}
          </div>

          {/* Revision Request Button */}
          {!revisionSubmitted && (
            <div className="text-center">
              <button
                onClick={() => {
                  if (selectedImagesForRevision.size === 0) {
                    alert('Please select at least one portrait to request changes for.');
                    return;
                  }
                  setShowRevisionModal(true);
                }}
                disabled={selectedImagesForRevision.size === 0}
                className="bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500 text-white px-6 py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Request Changes ({selectedImagesForRevision.size} selected)
              </button>
              <p className="text-zinc-500 text-sm mt-2">
                Select portraits above, then click to describe the changes you'd like
              </p>
            </div>
          )}

          {revisionSubmitted && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
              <p className="text-amber-400 font-medium">
                ✓ Revision request submitted! We'll get back to you within 24 hours.
              </p>
            </div>
          )}
        </section>

        {/* Visual Separator */}
        <div className="border-t-2 border-amber-500/20 my-16" />

        {/* SECTION 2: Bonus Upsell */}
        {propBonusImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-24 mt-16 border-2 border-amber-500/30 rounded-3xl p-8 md:p-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm"
          >
            {/* Heading */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-amber-400" />
                <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
                  Want 5 More Stunning Portraits?
                </h2>
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-slate-300 text-base md:text-lg font-light max-w-2xl mx-auto mb-2">
                Unlock 5 additional bonus theme portraits for just $15
              </p>
            </div>

            {/* Bonus Images Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 mb-10">
              {propBonusImages.map((img, index) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-2xl"
                >
                  <ImageComponent
                    src={img.url}
                    alt={`Bonus Portrait ${index + 1}`}
                    width={800}
                    height={1000}
                    className={`w-full h-auto object-cover transition-all duration-700 ${!isUnlocked
                      ? 'filter blur-[4px]'
                      : 'group-hover:scale-105 cursor-pointer'
                      }`}
                    onClick={() => isUnlocked && setSelectedImage(img)}
                  />

                  {/* Light Watermark Overlay (Locked State) */}
                  {!isUnlocked && (
                    <motion.div
                      onClick={handleUnlockBonus}
                      whileHover={{ scale: 1.02 }}
                      className="absolute inset-0 bg-white/40 flex flex-col items-center justify-center cursor-pointer hover:bg-white/50 transition-all z-10"
                    >
                      <Lock className="w-10 h-10 text-slate-800 mb-2 drop-shadow-lg" />
                    </motion.div>
                  )}

                  {/* Unlocked Hover Overlay */}
                  {isUnlocked && (
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none"
                    >
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Download className="w-4 h-4" /> Download / Customize
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Unlock Button (Centered, Prominent) */}
            {!isUnlocked && (
              <div className="text-center mb-8">
                <motion.button
                  onClick={handleUnlockBonus}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-amber px-10 py-5 text-lg md:text-xl rounded-full font-bold shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:shadow-[0_0_40px_rgba(251,191,36,0.7)] transition-all"
                >
                  <Lock className="w-6 h-6 inline mr-3" />
                  Unlock All 5 Bonus Themes for $15
                </motion.button>
                <p className="text-slate-400 text-sm mt-4">
                  <span className="text-amber-400 font-semibold">2,847</span> pet parents have unlocked their bonus collection
                </p>
              </div>
            )}

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <Smartphone className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Perfect for phone wallpapers, social media, and gifts</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <Download className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Download instantly after purchase</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Use for printing or digital sharing</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Visual Separator */}
        <div className="border-t-2 border-amber-500/20 my-16" />

        {/* SECTION 3: Physical Product Selection (Conditional) */}
        {!isDigitalOnly() && (
          <section className="mb-24">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">
                Select Your Favorite for Your {order.product_type}
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                Choose which portrait you'd like printed on your {order.product_type}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {allAvailablePortraits.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedPortraitIdForPrint(img.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden transition ${selectedPortraitIdForPrint === img.id
                    ? 'ring-4 ring-purple-500'
                    : 'hover:ring-2 hover:ring-zinc-600'
                    }`}
                >
                  <img
                    src={img.url}
                    alt="Portrait option"
                    className="w-full aspect-square object-cover"
                  />
                  {selectedPortraitIdForPrint === img.id && (
                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedPortraitIdForPrint && (
              <div className="mt-8">
                <ProductMockup
                  productType={order.product_type?.toLowerCase().includes('canvas') ? 'canvas' :
                    order.product_type?.toLowerCase().includes('tumbler') ? 'tumbler' :
                      order.product_type?.toLowerCase().includes('mug') ? 'mug' : 'blanket'}
                  portraitUrl={allAvailablePortraits.find(img => img.id === selectedPortraitIdForPrint)!.url}
                  petName={order.pet_name || 'Pet'}
                />
                <div className="text-center mt-6">
                  <button
                    onClick={handleConfirmPrintSelection}
                    disabled={loading}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Confirming...' : 'Confirm Print Selection'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION 4: Social Sharing - Keep existing lightbox and social consent below */}
      </div>

      {/* Revision Request Modal */}
      <RevisionRequestModal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleSubmitRevision}
        portraits={baseImages.map((img, index) => ({
          id: img.id,
          url: img.url,
          display_order: index + 1,
        }))}
        petName={order.pet_name || 'Your Pet'}
      />

      {/* LIGHTBOX */}
      <AnimatePresence>
        {
          selectedImage && (
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

                    <button
                      onClick={() => handleWallpaperDownload(selectedImage.url, `${order.pet_name}-Mobile`)}
                      className="w-full border border-slate-700 text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                      <Smartphone className="w-5 h-5" /> Phone Wallpaper
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
                      <ImageComponent
                        src={selectedImage.url}
                        fill
                        alt="Canvas Preview"
                        className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    <button
                      onClick={() => {
                        // TODO: Direct to canvas customization with this image
                        // For now, Unlock logic
                        handleUnlockBonus();
                      }}
                      className="w-full bg-brand-blue/10 border border-brand-blue/50 text-brand-blue py-3 rounded-xl font-bold hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      Customize Canvas
                    </button>
                  </div>

                  {/* Report Link */}
                  <div className="pt-4 text-center">
                    <button
                      // onClick={() => setIsReporting(true)}
                      className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                      Issue with this image? Report it.
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </motion.div >
  );
}
