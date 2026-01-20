'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Plus, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { ProductTemplate } from '@/components/ProductMockup';

export default function ProductManagerPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<ProductTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newLink, setNewLink] = useState('');
    const [newAspectRatio, setNewAspectRatio] = useState<'square' | 'portrait'>('square');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('product_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // @ts-ignore - Supabase types might not match exactly yet
            setProducts(data);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to archive this template?')) return;

        const { error } = await supabase
            .from('product_templates')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            alert('Failed to delete');
        } else {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handleUploadAndCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !newName || !newLink) return;

        setUploading(true);
        try {
            // 1. Upload Image
            const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('mockups')
                .upload(filename, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('mockups')
                .getPublicUrl(filename);

            // 3. Insert Database Record
            const { data: insertData, error: insertError } = await supabase
                .from('product_templates')
                .insert({
                    name: newName,
                    overlay_url: publicUrl,
                    aspect_ratio: newAspectRatio,
                    purchase_link: newLink,
                    is_active: true
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 4. Reset & Refresh
            setNewName('');
            setNewLink('');
            setFile(null);
            // reset file input manually if needed via ref, strictly not required for React logic reset
            const fileInput = document.getElementById('overlay-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // @ts-ignore
            setProducts([insertData, ...products]);

        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-brand-navy font-playfair">Product Manager</h1>
                    <p className="text-zinc-500">Add or remove mockup templates for the customer portal.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* LEFT: Create Form */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xl shadow-brand-navy/5 h-fit sticky top-8">
                    <h2 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add New Product
                    </h2>

                    <form onSubmit={handleUploadAndCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1">Product Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Classic Mug"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-brand-blue/50 outline-none text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1">Purchase URL</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={newLink}
                                onChange={e => setNewLink(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-brand-blue/50 outline-none text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1">Aspect Ratio</label>
                            <select
                                value={newAspectRatio}
                                onChange={e => setNewAspectRatio(e.target.value as any)}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-brand-blue/50 outline-none text-gray-900"
                            >
                                <option value="square">Square (1:1)</option>
                                <option value="portrait">Portrait (3:4)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-navy mb-1">Overlay Image (PNG)</label>
                            <div className="border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer hover:bg-zinc-50 transition-colors relative">
                                <input
                                    id="overlay-upload"
                                    type="file"
                                    accept="image/png"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    required
                                />
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                    <Upload className="w-6 h-6" />
                                    <span className="text-xs truncate max-w-[200px]">
                                        {file ? file.name : "Click to upload transparent PNG"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-navy/20 transition-all"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Product"}
                        </button>
                    </form>
                </div>

                {/* RIGHT: Product List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                        Active Products ({products.length})
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400">
                            No products found. Add one on the left!
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {products.map(product => (
                                <div key={product.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                                    {/* Preview Header */}
                                    <div className={`relative w-full bg-gray-50 ${product.aspect_ratio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square'}`}>
                                        {/* Checkerboard background for transparency checks */}
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                                        <div className="absolute inset-0 p-4">
                                            <Image
                                                src={product.overlay_url}
                                                alt={product.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="absolute top-2 right-2 p-2 bg-white/90 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all shadow-sm border border-gray-100"
                                            title="Delete Template"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="p-4 border-t border-gray-100">
                                        <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                                        <a href={product.purchase_link} target="_blank" className="text-xs text-blue-600 truncate block hover:underline mt-1">
                                            {product.purchase_link}
                                        </a>
                                        <div className="mt-3 flex gap-2">
                                            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                                                {product.aspect_ratio}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
