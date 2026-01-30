'use client';

import { useState, useRef } from 'react';
import { X, Upload, Plus, Loader2 } from 'lucide-react';
import { createManualOrder } from '../actions';

interface ManualOrderModalProps {
    onClose: () => void;
}

export default function ManualOrderModal({ onClose }: ManualOrderModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mockupFiles, setMockupFiles] = useState<File[]>([]);
    const petPhotoInputRef = useRef<HTMLInputElement>(null);
    const mockupsInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Append mockup files manually since we manage them in state
        mockupFiles.forEach((file) => {
            formData.append('mockups', file);
        });

        try {
            await createManualOrder(formData);
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Order creation failed:", err);
            setError(err.message || "Failed to create order");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMockupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMockupFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeMockup = (index: number) => {
        setMockupFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <h2 className="text-xl font-bold text-zinc-900">Create Manual Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider">Customer Info</h3>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Customer Name</label>
                                <input name="customerName" required className="w-full px-3 py-2 border rounded-lg" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                <input name="customerEmail" type="email" required className="w-full px-3 py-2 border rounded-lg" placeholder="john@example.com" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider">Pet Details</h3>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Pet Name</label>
                                <input name="petName" required className="w-full px-3 py-2 border rounded-lg" placeholder="Buddy" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Breed (Optional)</label>
                                <input name="petBreed" className="w-full px-3 py-2 border rounded-lg" placeholder="Golden Retriever" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Additional Details (Special Notes)</label>
                        <textarea name="petDetails" className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Blue collar, white left paw..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pet Photo - Required for Generation */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Pet Photo</label>
                            <div
                                className="border-2 border-dashed border-zinc-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors cursor-pointer"
                                onClick={() => petPhotoInputRef.current?.click()}
                            >
                                <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                                <span className="text-sm text-zinc-500">Click to upload pet photo</span>
                                <input
                                    ref={petPhotoInputRef}
                                    type="file"
                                    name="petPhoto"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        // Force update to show file name could be added here
                                    }}
                                />
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">Required for AI generation. Optional if uploading pre-generated mockups.</p>
                        </div>

                        {/* Pre-generated Mockups */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Pre-generated Mockups (Optional)</label>
                            <div
                                className="border-2 border-dashed border-zinc-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors cursor-pointer"
                                onClick={() => mockupsInputRef.current?.click()}
                            >
                                <Plus className="w-8 h-8 text-zinc-400 mb-2" />
                                <span className="text-sm text-zinc-500">Add Mockup Images</span>
                                <input
                                    ref={mockupsInputRef}
                                    type="file"
                                    // Removed name="mockups" to prevent double submission
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleMockupChange}
                                />
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                                Uploading mockups bypasses AI generation and sets status to "Ready".
                            </p>
                        </div>
                    </div>

                    {/* Mockup Preview List */}
                    {mockupFiles.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {mockupFiles.map((file, idx) => (
                                <div key={idx} className="relative group aspect-square bg-zinc-100 rounded-lg overflow-hidden">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMockup(idx)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-zinc-100 pt-6 flex items-center justify-between">
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input name="isPaid" type="checkbox" className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue" />
                                <span className="text-sm font-medium text-zinc-700">Mark as Paid</span>
                            </label>

                            <select name="productType" className="text-sm border-zinc-200 rounded-lg focus:ring-brand-blue">
                                <option value="Digital Only">Digital Only</option>
                                <option value="Canvas Print">Canvas Print</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isLoading ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
