'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Lock, Smartphone, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createCheckoutSession } from '@/app/actions/stripe';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import StepIndicator, { type Step } from './StepIndicator';
import ProductMockup from './ProductMockup';
import RevisionRequestModal from './RevisionRequestModal';

export default function CustomerGallery({
  order,
  baseImages,
  bonusImages,
  mobileImages
}: {
  order: Order;
  baseImages: ImageType[];
  bonusImages: ImageType[];
  mockupImages: ImageType[];
  upsellImages: ImageType[];
  mobileImages: ImageType[];
}) {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('payment') === 'success';

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(order.bonus_unlocked || paymentSuccess);
  const [selectedPortraitIdForPrint, setSelectedPortraitIdForPrint] = useState<string | null>(
    order.selected_image_id || null
  );
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedImagesForRevision, setSelectedImagesForRevision] = useState<Set<string>>(new Set());
  const [revisionSubmitted, setRevisionSubmitted] = useState(order.revision_status !== 'none');
  const [loading, setLoading] = useState(false);
  // Step 2: Real Printify Mockup Generation
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);

  // Step 3: Social Media Consent
  const [socialConsent, setSocialConsent] = useState(order.social_consent || false);
  const [instagramHandle, setInstagramHandle] = useState(order.social_handle || '');
  const [selectedPortraitForSharing, setSelectedPortraitForSharing] = useState<ImageType | null>(
    selectedPortraitIdForPrint ? baseImages.find(img => img.id === selectedPortraitIdForPrint) || baseImages[0] : baseImages[0]
  );

  // Helper Functions
  const isDigitalOnly = () => {
    if (!order.product_type) return true;
    const digitalKeywords = ['digital', 'download', 'file'];
    return digitalKeywords.some(keyword =>
      order.product_type!.toLowerCase().includes(keyword)
    );
  };

  const allAvailablePortraits = isUnlocked
    ? [...baseImages, ...bonusImages]
    : baseImages;

  // Confetti on page load
  useEffect(() => {
    // Fire confetti with portal colors
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7DC6FF', '#FF9AC4', '#E4F3FF', '#E0D6FF']
    });

    if (paymentSuccess) {
      setIsUnlocked(true);
    }
  }, [paymentSuccess]);

  // Steps configuration
  const steps: Step[] = [
    { number: 1, label: 'Download', status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'inactive' },
    { number: 2, label: isDigitalOnly() ? 'Canvas Upsell' : 'Select Print', status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'inactive' },
    { number: 3, label: 'Social Sharing', status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'inactive' },
    { number: 4, label: 'Bonus Themes', status: currentStep === 4 ? 'active' : 'inactive' },
  ];

  // Handlers
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder(`Taylored-${order.pet_name}`);

    await Promise.all(baseImages.map(async (img, i) => {
      const response = await fetch(img.url);
      const blob = await response.blob();
      folder?.file(`portrait-${i + 1}.png`, blob);
    }));

    if (isUnlocked) {
      await Promise.all(bonusImages.map(async (img, i) => {
        const response = await fetch(img.url);
        const blob = await response.blob();
        folder?.file(`bonus-${i + 1}.png`, blob);
      }));
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Taylored-Portraits-${order.pet_name}.zip`);
  };

  const handleMobileDownload = async () => {
    if (!mobileImages || mobileImages.length === 0) {
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

  const handleSubmitRevision = async (selectedImageIds: string[], notes: string, referencePhotos?: File[]) => {
    setLoading(true);
    try {
      let referencePhotoUrls: string[] = [];
      if (referencePhotos && referencePhotos.length > 0) {
        console.log('Reference photos to upload:', referencePhotos);
      }

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

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7DC6FF', '#FF9AC4']
      });
      alert('Print selection confirmed!');
      setCurrentStep(3); // Move to social sharing step
    } catch (error) {
      console.error('Error confirming selection:', error);
      alert('Failed to confirm selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleImageForRevision = (imageId: string) => {
    const newSet = new Set(selectedImagesForRevision);
    if (newSet.has(imageId)) {
      newSet.delete(imageId);
    } else {
      newSet.add(imageId);
    }
    setSelectedImagesForRevision(newSet);
  };

  // Render
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Step Indicator */}
        <StepIndicator steps={steps} />

        {/* White Content Card */}
        <div className="card-white max-w-5xl mx-auto fade-in-up">

          {/* STEP 1: Download Hub */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-poppins font-bold text-portal-navy mb-4">
                  Your 5 Custom Portraits Are Ready! 🎉
                </h1>
                <p className="text-portal-gray text-lg mb-8">
                  Download instantly or view in full screen
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <button onClick={handleDownloadAll} className="btn-primary">
                    <Download className="w-5 h-5 mr-2" />
                    Download Full Pack
                  </button>
                  <button onClick={handleMobileDownload} className="btn-secondary">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Mobile Wallpapers
                  </button>
                </div>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {baseImages.map((img, index) => (
                  <div key={img.id} className="relative group">
                    <div className="image-card">
                      <img
                        src={img.url}
                        alt={`Portrait ${index + 1}`}
                        className="w-full aspect-square object-cover cursor-pointer"
                        onClick={() => setSelectedImage(img)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(img.url, '_blank');
                        }}
                        className="absolute bottom-3 right-3 p-3 bg-portal-sky/90 rounded-full hover:bg-portal-sky transition-colors"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <p className="text-center text-sm text-portal-gray mt-2 font-medium">Portrait {index + 1}</p>
                  </div>
                ))}
              </div>

              {/* Revision Request */}
              {!revisionSubmitted ? (
                <div className="text-center pt-4">
                  <p className="text-portal-gray text-sm mb-4">
                    💡 Not happy with a portrait? Request changes below
                  </p>
                  <button
                    onClick={() => setShowRevisionModal(true)}
                    className="btn-outline"
                  >
                    Request Changes
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 font-semibold">
                    ✓ Revision request submitted! We'll get back to you within 24 hours.
                  </p>
                </div>
              )}

              {/* Next Button */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-primary px-12"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Print Selection or Canvas Upsell */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {!isDigitalOnly() ? (
                // Physical Product - Print Selection
                <>
                  <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-poppins font-bold text-portal-navy mb-2">
                      Pick Your Favorite for Your {order.product_type}
                    </h2>
                    <p className="text-portal-gray text-lg">
                      Click an image to see it on your canvas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {allAvailablePortraits.map((img) => (
                      <div
                        key={img.id}
                        onClick={async () => {
                          setSelectedPortraitIdForPrint(img.id);
                          // Generate REAL mockup with THIS portrait
                          setIsGeneratingMockup(true);
                          setMockupUrl(null);
                          try {
                            const response = await fetch('/api/generate-mockup', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                portraitUrl: img.url,
                                productType: order.product_type || 'canvas-11x14'
                              })
                            });
                            if (response.ok) {
                              const { mockupUrl: generatedMockupUrl } = await response.json();
                              setMockupUrl(generatedMockupUrl);
                            } else {
                              console.error('Mockup generation failed:', await response.text());
                            }
                          } catch (error) {
                            console.error('Failed to generate mockup:', error);
                          } finally {
                            setIsGeneratingMockup(false);
                          }
                        }}
                        className={`
                          cursor-pointer rounded-xl overflow-hidden transition-all
                          ${selectedPortraitIdForPrint === img.id ? 'image-selected' : 'image-card'}
                        `}
                      >
                        <img
                          src={img.url}
                          alt="Portrait option"
                          className="w-full aspect-square object-cover"
                        />
                        {selectedPortraitIdForPrint === img.id && (
                          <div className="absolute top-2 right-2 bg-portal-sky rounded-full p-1">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Real Printify Mockup */}
                  {selectedPortraitIdForPrint && (
                    <div className="mt-8 space-y-6">
                      {isGeneratingMockup && (
                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-portal-sky border-t-transparent mb-4"></div>
                          <p className="text-portal-gray text-lg">Generating your {order.product_type} preview...</p>
                          <p className="text-portal-gray text-sm mt-2">This may take a few seconds</p>
                        </div>
                      )}

                      {!isGeneratingMockup && mockupUrl && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-6"
                        >
                          <div className="text-center">
                            <h3 className="text-2xl font-poppins font-bold text-portal-navy mb-2">
                              Here's what your {order.product_type} will look like:
                            </h3>
                          </div>

                          <div className="relative w-full max-w-3xl mx-auto">
                            <img
                              src={mockupUrl}
                              alt="Real product mockup"
                              className="w-full rounded-xl shadow-2xl"
                            />
                          </div>

                          <div className="text-center">
                            <button
                              onClick={handleConfirmPrintSelection}
                              disabled={loading}
                              className="btn-primary px-12"
                            >
                              {loading ? 'Confirming...' : 'Confirm Selection'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Digital Only - Canvas Upsell
                <div className="text-center space-y-6">
                  <h2 className="text-3xl md:text-4xl font-poppins font-bold text-portal-navy">
                    Want to Turn Your Portrait into Art?
                  </h2>
                  <p className="text-portal-gray text-lg max-w-2xl mx-auto">
                    Get your favorite portrait printed on museum-quality canvas. Perfect for your home!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <div className="bg-portal-cool-blue/30 rounded-xl p-6">
                      <h3 className="font-bold text-portal-navy mb-2">Premium Canvas</h3>
                      <p className="text-sm text-portal-gray">Museum-quality, ready to hang</p>
                    </div>
                    <div className="bg-portal-soft-lilac/30 rounded-xl p-6">
                      <h3 className="font-bold text-portal-navy mb-2">Multiple Sizes</h3>
                      <p className="text-sm text-portal-gray">From 8x10 to 24x36 inches</p>
                    </div>
                  </div>
                  <button onClick={() => setCurrentStep(3)} className="btn-primary px-12">
                    Continue to Social Sharing
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Social Media Consent & Sharing */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-poppins font-bold text-portal-navy mb-2">
                  Share {order.pet_name}'s Transformation! 🐾
                </h2>
                <p className="text-portal-gray text-lg">
                  See the amazing before & after! Share on social to inspire other pet parents
                </p>
              </div>

              {/* Before/After Comparison */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before */}
                  <div className="card-white space-y-3">
                    <h3 className="font-poppins font-bold text-portal-navy text-center text-xl">Before</h3>
                    <div className="relative aspect-square rounded-xl overflow-hidden">
                      {order.pet_image_url ? (
                        <img
                          src={order.pet_image_url}
                          alt={`${order.pet_name} original photo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <p className="text-gray-500"> Original Photo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After */}
                  <div className="card-white space-y-3">
                    <h3 className="font-poppins font-bold text-portal-navy text-center text-xl">After</h3>
                    <div className="relative aspect-square rounded-xl overflow-hidden">
                      {selectedPortraitForSharing && (
                        <img
                          src={selectedPortraitForSharing.url}
                          alt={`${order.pet_name} portrait`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Portrait Selection for Sharing */}
                <div className="mt-6">
                  <p className="text-center text-portal-gray mb-3">Choose which portrait to share:</p>
                  <div className="grid grid-cols-5 gap-3">
                    {baseImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedPortraitForSharing(img)}
                        className={`cursor-pointer rounded-lg overflow-hidden transition-all ${selectedPortraitForSharing?.id === img.id ? 'ring-4 ring-portal-sky' : 'opacity-60 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={img.url}
                          alt="Portrait option"
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Consent */}
              <div className="max-w-xl mx-auto space-y-4">
                <div className="card-white">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={socialConsent}
                      onChange={(e) => setSocialConsent(e.target.checked)}
                      className="mt-1 w-5 h-5 text-portal-sky focus:ring-portal-sky rounded"
                    />
                    <span className="text-portal-gray">
                      I consent to Taylored sharing {order.pet_name}'s photo on social media to inspire other pet parents ❤️
                    </span>
                  </label>
                </div>

                {socialConsent && (
                  <div className="card-white">
                    <label className="block text-portal-navy font-semibold mb-2">
                      Your Instagram Handle (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-portal-gray text-xl">@</span>
                      <input
                        type="text"
                        value={instagramHandle.replace('@', '')}
                        onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                        placeholder="your_handle"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-portal-sky focus:ring-2 focus:ring-portal-sky/20 transition-all"
                      />
                    </div>
                    <p className="text-sm text-portal-gray mt-2">
                      We'll tag you when we share your pet's transformation!
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={async () => {
                    // Save social consent to database
                    try {
                      await fetch(`/api/orders/${order.id}/social-consent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          social_consent: socialConsent,
                          social_handle: socialConsent ? instagramHandle : null,
                        }),
                      });
                    } catch (error) {
                      console.error('Error saving consent:', error);
                    }
                    setCurrentStep(4); // Move to bonus step
                  }}
                  className="btn-primary px-12"
                >
                  Continue to Bonus Themes
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Bonus Upsell */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-poppins font-bold text-portal-navy mb-2">
                  Unlock 5 More Portraits in Bonus Themes
                </h2>
                <p className="text-portal-gray text-lg">
                  Get 5 additional portraits in a different theme for just $15
                </p>
              </div>

              {/* Bonus Images Grid with Frosted Glass */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {bonusImages.map((img, index) => (
                  <div key={img.id} className="relative">
                    <div className="image-card relative overflow-hidden">
                      <img
                        src={img.url}
                        alt={`Bonus Portrait ${index + 1}`}
                        className={`w-full aspect-square object-cover ${!isUnlocked ? 'blur-sm' : ''}`}
                      />
                      {!isUnlocked && (
                        <div className="frosted-glass" onClick={handleUnlockBonus}>
                          <Lock className="w-12 h-12 text-portal-navy mb-2" />
                          <span className="text-portal-navy font-semibold text-sm px-4 text-center">
                            Unlock 5 Bonus Images - $15
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unlock Button */}
              {!isUnlocked && (
                <div className="text-center">
                  <button
                    onClick={handleUnlockBonus}
                    className="btn-primary px-12 text-xl py-5"
                  >
                    <Lock className="w-6 h-6 mr-3" />
                    Unlock for $15
                  </button>
                  <p className="text-portal-gray text-sm mt-4">
                    Perfect for phone wallpapers, social media, and gifts
                  </p>
                </div>
              )}

              {isUnlocked && (
                <div className="text-center">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="text-green-700 font-bold text-xl mb-2">🎉 Bonus Themes Unlocked!</h3>
                    <p className="text-green-600">Download your 5 bonus portraits above</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
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

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 text-white hover:text-portal-sky p-2 z-50">
              <X className="w-8 h-8" />
            </button>

            <div className="max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <Image
                src={selectedImage.url}
                alt="Detail"
                width={1200}
                height={1200}
                className="object-contain max-h-[90vh] rounded-xl"
                quality={100}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
