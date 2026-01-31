'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check } from 'lucide-react';
import Image from 'next/image';

interface RevisionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedImageIds: string[], notes: string, referencePhotos?: File[]) => void;
  portraits: Array<{ id: string; url: string; display_order: number }>;
  petName: string;
}

export default function RevisionRequestModal({ isOpen, onClose, onSubmit, portraits, petName }: RevisionRequestModalProps) {
  const [notes, setNotes] = useState('');
  const [selectedPortraitIds, setSelectedPortraitIds] = useState<string[]>([]);
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);

  const togglePortraitSelection = (id: string) => {
    setSelectedPortraitIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedPortraitIds.length === 0) {
      alert('Please select at least one portrait that needs adjustments');
      return;
    }
    if (notes.trim()) {
      onSubmit(selectedPortraitIds, notes, referencePhotos.length > 0 ? referencePhotos : undefined);
      setNotes('');
      setSelectedPortraitIds([]);
      setReferencePhotos([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Let's Perfect Your Portraits
                  </h2>
                  <p className="text-gray-600">
                    We want to make sure every portrait looks exactly like {petName}! Select the portraits that need tweaking and let us know what to adjust.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Which portraits need adjustments?
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {portraits.map((portrait) => (
                    <button
                      key={portrait.id}
                      type="button"
                      onClick={() => togglePortraitSelection(portrait.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPortraitIds.includes(portrait.id)
                          ? 'border-amber-500 ring-2 ring-amber-500/50'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      <Image
                        src={portrait.url}
                        alt={`Portrait ${portrait.display_order}`}
                        fill
                        className="object-cover"
                      />
                      {selectedPortraitIds.includes(portrait.id) && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        #{portrait.display_order}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select one or more portraits that need adjustments
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  For the selected portraits, what needs to be adjusted?
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please be specific! For example: 'Portrait #1: The left ear should be more floppy' or 'Portrait #3: The white patch on the chest is missing'"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have a photo that shows what you mean? (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setReferencePhotos(Array.from(e.target.files));
                    }
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a reference photo showing the specific feature you'd like adjusted
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedPortraitIds.length === 0 || !notes.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
