'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, Copy, Wand2, FolderUp } from 'lucide-react';
import Image from 'next/image';
// import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Client-Side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateOrderPage() {
  // const router = useRouter();
  const [activeTab, setActiveTab] = useState<'generate' | 'manual'>('generate');

  // Common Fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Split Product Type Logic
  const [selectedTheme, setSelectedTheme] = useState('royalty');
  const [selectedItemType, setSelectedItemType] = useState('Canvas'); // Default
  // We'll combine these on submit

  // Dynamic Templates
  const [availableTemplates, setAvailableTemplates] = useState<{ id: string, name: string }[]>([]);

  // Generate Fields
  const [petFiles, setPetFiles] = useState<File[]>([]);
  const [petBreed, setPetBreed] = useState('');
  const [petDetails, setPetDetails] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);

  // Manual Fields
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]); // New State for Mockups

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ url: string } | null>(null);

  // Fetch Templates on Mount
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('mockup_templates')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (data) setAvailableTemplates(data);
    };
    fetchTemplates();
  }, []);

  // Dropzone for Manual
  const manualDropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 50,
    onDrop: (acceptedFiles) => setManualFiles(prev => [...prev, ...acceptedFiles])
  });

  // Dropzone for Manual Mockups
  const mockupDropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 50,
    onDrop: (acceptedFiles) => setMockupFiles(prev => [...prev, ...acceptedFiles])
  });

  // Dropzone for Pet (Single file usually)
  const petDropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => setPetFiles(acceptedFiles)
  });

  const removeManualFile = (index: number) => {
    setManualFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeMockupFile = (index: number) => {
    setMockupFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Combine Theme + Item Type for the API
    const finalProductType = `${selectedTheme} ${selectedItemType}`.trim();

    try {
      if (activeTab === 'generate') {
        if (petFiles.length === 0) {
          alert('Please upload a pet photo');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('customerName', customerName);
        formData.append('customerEmail', customerEmail);
        formData.append('productType', finalProductType); // Concatenated
        formData.append('petPhoto', petFiles[0]);
        formData.append('petBreed', petBreed);
        formData.append('petDetails', petDetails);
        formData.append('autoApprove', String(autoApprove));

        // Call Generation API
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSuccessData({ url: `${window.location.origin}/admin/review` });

        // Auto Redirect Removed
        // setTimeout(() => {
        //   router.push('/admin/review');
        // }, 1500);

      } else {
        // Call Manual API
        const formData = new FormData();
        formData.append('customerName', customerName);
        formData.append('customerEmail', customerEmail);
        formData.append('productType', finalProductType);
        manualFiles.forEach(f => formData.append('files', f));
        mockupFiles.forEach(f => formData.append('mockups', f)); // Append Mockups

        const res = await fetch('/api/orders/manual', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSuccessData({ url: `${window.location.origin}${data.customerUrl}` });
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message || 'Error occurred');
      } else {
        alert('Error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-zinc-950">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">Create Order</h1>
          <p className="text-zinc-400">Choose how to fulfill this order</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Wand2 className="w-4 h-4" />
            AI Generate
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <FolderUp className="w-4 h-4" />
            Manual Upload
          </button>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Customer Name</label>
              <input
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                value={customerName} onChange={e => setCustomerName(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Customer Email</label>
              <input
                type="email"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required
              />
            </div>
          </div>

          {activeTab === 'generate' ? (
            <div className="space-y-4">
              {/* SPLIT PRODUCT SELECTION */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Art Theme</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                    value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}
                  >
                    <option value="royalty">Royalty</option>
                    <option value="spaday">Spa Day</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="valentines">Valentine&apos;s</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Item / Template</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                    value={selectedItemType} onChange={e => setSelectedItemType(e.target.value)}
                  >
                    <option value="Canvas">Default Canvas</option>
                    <option value="Digital">Digital Only</option>
                    {availableTemplates.length > 0 && <option disabled>-- Custom Templates --</option>}
                    {availableTemplates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Breed Inputs */}
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Pet Breed</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                    value={petBreed} onChange={e => setPetBreed(e.target.value)}
                    placeholder="e.g. Golden Retriever"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Unique Features (Identity Lock)</label>
                  <input
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                    value={petDetails} onChange={e => setPetDetails(e.target.value)}
                    placeholder="e.g. White spot on chest, missing left eye"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Pet Photo</label>
                <div {...petDropzone.getRootProps()} className="border-2 border-dashed border-zinc-800 hover:border-amber-500 rounded-xl p-8 text-center cursor-pointer transition-colors">
                  <input {...petDropzone.getInputProps()} />
                  {petFiles.length > 0 ? (
                    <div className="relative w-32 h-32 mx-auto">
                      <Image src={URL.createObjectURL(petFiles[0])} alt="Pet" fill className="object-cover rounded-lg" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPetFiles([]); }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X className="w-4 h-4 text-white" /></button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-zinc-400 text-sm">Drag & drop dog photo here</p>
                    </>
                  )}
                </div>
              </div>

              {/* Auto Approve Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 mt-4">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={autoApprove}
                  onChange={e => setAutoApprove(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <label htmlFor="autoApprove" className="text-sm text-zinc-300 cursor-pointer select-none font-medium">
                  Auto-Approve Results (Skip &quot;Approve All&quot;)
                </label>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Product Type (Type manually for custom)</label>
                <input
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                  value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)} // Re-using state for manual input simplicity
                  placeholder="e.g. Custom Portrait"
                />
              </div>

              <div {...manualDropzone.getRootProps()} className="border-2 border-dashed border-zinc-800 hover:border-amber-500 rounded-xl p-8 text-center cursor-pointer transition-colors">
                <input {...manualDropzone.getInputProps()} />
                <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">Drag & drop finished images here</p>
                <p className="text-zinc-600 text-xs mt-1">{manualFiles.length} files selected</p>
              </div>

              {manualFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {manualFiles.map((file, i) => (
                    <div key={i} className="aspect-square bg-zinc-900 rounded relative group overflow-hidden">
                      <Image src={URL.createObjectURL(file)} alt="preview" fill className="object-cover" />
                      <button type="button" onClick={() => removeManualFile(i)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* MOCKUP SECTION */}
              <div className="border-t border-zinc-800 my-4 pt-4">
                <label className="text-xs text-zinc-500 mb-1 block">Manual Mockups (Optional)</label>
                <div {...mockupDropzone.getRootProps()} className="border-2 border-dashed border-zinc-800 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-zinc-900/30">
                  <input {...mockupDropzone.getInputProps()} />
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">Drag & drop mockup images here</p>
                  <p className="text-zinc-600 text-xs mt-1">{mockupFiles.length} files selected</p>
                </div>

                {mockupFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {mockupFiles.map((file, i) => (
                      <div key={i} className="aspect-square bg-zinc-900 rounded relative group overflow-hidden border border-blue-500/30">
                        <Image src={URL.createObjectURL(file)} alt="mockup-preview" fill className="object-cover" />
                        <button type="button" onClick={() => removeMockupFile(i)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button disabled={loading} className="w-full btn-primary py-3 rounded-lg font-bold">
            {loading ? 'Processing...' : (activeTab === 'generate' ? 'Start Generation' : 'Create & Approve Order')}
          </button>
        </form>

        <AnimatePresence>
          {successData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-xl border border-green-900/50 bg-green-900/10 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-400 mb-2">Order Created!</h2>
              {activeTab === 'generate' ? (
                <p className="text-zinc-400 mb-4">Images are generating. You can view them now or create another order.</p>
              ) : (
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg mt-4">
                  <input readOnly value={successData.url} className="bg-transparent flex-1 text-xs text-zinc-400 outline-none font-mono" />
                  <button onClick={() => navigator.clipboard.writeText(successData.url)} className="p-2 hover:bg-white/10 rounded"><Copy className="w-4 h-4 text-zinc-400" /></button>
                </div>
              )}

              <div className="mt-4 flex gap-2 justify-center">
                <a href={successData.url} target="_blank" className="btn-secondary px-4 py-2 rounded text-sm">Open Link</a>
                <button onClick={() => { setSuccessData(null); setManualFiles([]); setMockupFiles([]); setPetFiles([]); setCustomerName(''); }} className="btn-primary px-4 py-2 rounded text-sm">New Order</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
