'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import JSConfetti from 'js-confetti';
import ImageLightbox from './ImageLightbox';
import PawStepper from './PawStepper';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import StepOneGallery from './CustomerGallerySteps/StepOneGallery';
import StepTwoRedemption from './CustomerGallerySteps/StepTwoRedemption';
import StepThreeBonus from './CustomerGallerySteps/StepThreeBonus';
import RevisionStatus from './CustomerGallerySteps/RevisionStatus';
import type { ProductTemplate } from './ProductMockup';

// Re-export shared types/constants if needed
export const PRINT_PRODUCTS = [
  { id: 'digital', name: 'Digital Download', price: 0, description: 'High-res file for social media & print' },
  { id: 'canvas-11x14', name: 'Classic Canvas', price: 39, description: '11x14" gallery-wrapped canvas' },
  { id: 'canvas-16x20', name: 'Premium Canvas', price: 59, description: '16x20" gallery-wrapped canvas' },
  { id: 'tumbler', name: 'Travel Tumbler', price: 34, description: '20oz insulated tumbler' },
  { id: 'bear', name: 'Cuddle Bear', price: 34, description: 'Soft plush bear with custom t-shirt' },
];

interface CustomerGalleryProps {
  order: Order;
  baseImages: ImageType[];
  bonusImages: ImageType[];
  mockupImages: ImageType[];
  productTemplates: ProductTemplate[];
  upsellImages: ImageType[];
}

export default function CustomerGallery({ order, baseImages, bonusImages, mockupImages, productTemplates, upsellImages }: CustomerGalleryProps) {
  // State for Steps
  const [currentStep, setCurrentStep] = useState(1);
  const steps = ['The Reveal', 'Redemption', 'Bonus & Share'];

  // Global State passed down
  const [selectedImageId, setSelectedImageId] = useState<string | null>(order.selected_image_id || null);
  const [printProduct, setPrintProduct] = useState<string>(order.selected_print_product || '');
  const [notes, setNotes] = useState<string>(order.customer_notes || '');
  const [bonusUnlocked, setBonusUnlocked] = useState(order.bonus_unlocked || false);
  const [isRevising, setIsRevising] = useState(
    order.status === 'revising' || order.revision_status === 'requested' || order.revision_status === 'in_progress'
  );

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<Array<{ id: string; url: string }>>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Derived State
  const petName = order.pet_name || order.customer_name;
  const selectedImage = baseImages.find((img) => img.id === selectedImageId);

  // Initial Effects
  useEffect(() => {
    // If order is already confirmed, maybe jump to step 3? 
    // For now, let's start at 1 but show progress if needed.
    // Or if confirmed, show step 3 as default?
    if (order.selected_image_id && order.selected_print_product) {
      setCurrentStep(3);
    }
  }, [order]);

  useEffect(() => {
    const trackView = async () => {
      if (!order.viewed_at) {
        await fetch(`/api/customer/${order.id}/track-view`, { method: 'POST' });
      }
    };
    trackView();
  }, [order.id, order.viewed_at]);

  useEffect(() => {
    const jsConfetti = new JSConfetti();
    jsConfetti.addConfetti({
      emojis: ['✨', '🐾'],
      confettiNumber: 30,
    });
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      setBonusUnlocked(true);
      setCurrentStep(3); // Ensure we are on the bonus step
      const jsConfetti = new JSConfetti();
      jsConfetti.addConfetti({
        emojis: ['🐶', '🐱', '🦴', '🐾'],
        confettiNumber: 150,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Shared Handlers
  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(c => c + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageClick = (images: ImageType[], index: number) => {
    setLightboxImages(images.map((img) => ({ id: img.id, url: img.url })));
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 space-y-2"
      >
        <h1 className="glow-text font-playfair text-3xl md:text-5xl">{petName}&apos;s Collection</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Every portrait helps a shelter animal find their home</span>
        </div>
      </motion.div>

      {/* Stepper */}
      <PawStepper currentStep={currentStep} steps={steps} />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {isRevising ? (
            <RevisionStatus
              petName={petName}
              notes={order.revision_notes || notes}
            />
          ) : (
            <>
              {currentStep === 1 && (
                <StepOneGallery
                  images={baseImages}
                  upsellImages={upsellImages}
                  petName={petName}
                  onImageClick={(idx) => handleImageClick(baseImages, idx)}
                  onNext={handleNextStep}
                  orderId={order.id}
                />
              )}
              {currentStep === 2 && (
                <StepTwoRedemption
                  orderId={order.id}
                  petName={petName}
                  images={baseImages}
                  mockupImages={mockupImages}
                  products={PRINT_PRODUCTS}
                  productTemplates={productTemplates}
                  selectedImageId={selectedImageId}
                  setSelectedImageId={setSelectedImageId}
                  printProduct={printProduct}
                  setPrintProduct={setPrintProduct}
                  notes={notes}
                  setNotes={setNotes}
                  onConfirm={() => {
                    handleNextStep();
                    const jsConfetti = new JSConfetti();
                    jsConfetti.addConfetti({ emojis: ['🐶', '🐱', '🦴', '🐾'] });
                  }}
                  onRequestRevision={() => {
                    setIsRevising(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
              {currentStep === 3 && (
                <StepThreeBonus
                  order={order}
                  petName={petName}
                  bonusImages={bonusImages}
                  bonusUnlocked={bonusUnlocked}
                  setBonusUnlocked={setBonusUnlocked}
                  onImageClick={(idx) => handleImageClick(bonusImages, idx)}
                  selectedImage={selectedImage}
                  printProduct={printProduct} // to show what they got
                />
              )}

            </>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Lightbox Overlay */}
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
          onDownload={async (id) => {
            // simplified download handler for lightbox context if needed, or pass the main one
            const img = lightboxImages.find(i => i.id === id);
            if (img) window.open(img.url, '_blank');
          }}
        />
      )}

    </div>
  );
}
