'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, Copy } from 'lucide-react';
import Image from 'next/image';

export default function CreateOrderPage() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [productType, setProductType] = useState('');
  const [primaryFiles, setPrimaryFiles] = useState<File[]>([]);
  const [upsellFiles, setUpsellFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderUrl, setOrderUrl] = useState('');

  const primaryDropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 20,
    onDrop: (acceptedFiles) => {
      setPrimaryFiles((prev) => [...prev, ...acceptedFiles].slice(0, 20));
    },
  });

  const upsellDropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setUpsellFiles((prev) => [...prev, ...acceptedFiles].slice(0, 5));
    },
  });

  const removePrimaryFile = (index: number) => {
    setPrimaryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUpsellFile = (index: number) => {
    setUpsellFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (primaryFiles.length === 0) {
      alert('Please upload at least one primary image');
      return;
    }

    if (upsellFiles.length === 0) {
      alert('Please upload at least one upsell image');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('customerName', customerName);
      formData.append('customerEmail', customerEmail);
      if (productType.trim()) {
        formData.append('productType', productType);
      }

      primaryFiles.forEach((file) => {
        formData.append('primaryImages', file);
      });

      upsellFiles.forEach((file) => {
        formData.append('upsellImages', file);
      });

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      const url = `${window.location.origin}${data.customerUrl}`;
      setOrderUrl(url);
      setShowSuccess(true);

      setCustomerName('');
      setCustomerEmail('');
      setProductType('');
      setPrimaryFiles([]);
      setUpsellFiles([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orderUrl);
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1>Create New Order</h1>
          <p className="text-zinc-400 mt-2">
            Fill in customer details and upload images
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-lg space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-zinc-300 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-[#7C3AED] transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">
                Customer Email *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-[#7C3AED] transition-colors"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">
              Product Type (optional)
            </label>
            <input
              type="text"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-[#7C3AED] transition-colors"
              placeholder="e.g., 11x14 Canvas, Digital Download (optional)"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">
              Primary Images * (Max 20)
            </label>
            <div
              {...primaryDropzone.getRootProps()}
              className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-[#7C3AED] transition-colors"
            >
              <input {...primaryDropzone.getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">
                Drag & drop primary images here, or click to select
              </p>
              <p className="text-zinc-600 text-sm mt-2">
                {primaryFiles.length} / 20 files selected
              </p>
            </div>

            {primaryFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {primaryFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Primary ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePrimaryFile(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-2">
              Upsell Images * (Max 5)
            </label>
            <div
              {...upsellDropzone.getRootProps()}
              className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-[#7C3AED] transition-colors"
            >
              <input {...upsellDropzone.getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">
                Drag & drop upsell images here, or click to select
              </p>
              <p className="text-zinc-600 text-sm mt-2">
                {upsellFiles.length} / 5 files selected
              </p>
            </div>

            {upsellFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {upsellFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Upsell ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeUpsellFile(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 rounded-lg max-w-md w-full space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2>Order Created!</h2>
                <p className="text-zinc-400">
                  Share this link with your customer
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-100 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary rounded-lg px-4"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="btn-primary rounded-lg w-full"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
