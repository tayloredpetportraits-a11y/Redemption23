'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, Loader2 } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from 'next/image';

interface Template {
    id: string;
    name: string;
    image_url: string;
    keywords: string[];
    is_active: boolean;
}

export default function MockupTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [keywords, setKeywords] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/mockups/templates');
            const data = await res.json();
            if (data.templates) setTemplates(data.templates);
        } catch (e) {
            console.error('Failed to load templates', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('keywords', keywords);

        try {
            const res = await fetch('/api/admin/mockups/templates/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                // Reset form
                setFile(null);
                setName('');
                setKeywords('');
                fetchTemplates(); // Reload list
            } else {
                alert('Upload failed');
            }
        } catch (err) {
            console.error(err);
            alert('Upload error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(`/api/admin/mockups/templates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTemplates();
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8">
            <header className="mb-8 pb-4 border-b border-zinc-800">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                    Mockup Templates
                </h1>
                <p className="text-zinc-500">Manage blank product images for automatic generation.</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Upload Form */}
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 h-fit">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-amber-500" />
                        Add New Template
                    </h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Template Name</label>
                            <input
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-amber-500 outline-none"
                                placeholder="e.g. Blank Canvas Horizontal"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Keywords</label>
                            <input
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-amber-500 outline-none"
                                placeholder="canvas, wall art, large"
                                value={keywords}
                                onChange={e => setKeywords(e.target.value)}
                            />
                            <p className="text-[10px] text-zinc-500 mt-1">Comma-separated keywords to match Shopify products.</p>
                        </div>

                        <div className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center hover:border-zinc-600 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                required
                            />
                            <div className="flex flex-col items-center">
                                <Upload className="w-8 h-8 text-zinc-600 mb-2" />
                                <span className="text-sm text-zinc-400">
                                    {file ? file.name : 'Click to Upload Image'}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="w-full btn-amber py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Template'}
                        </button>
                    </form>
                </div>

                {/* Right: Gallery */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {templates.map(t => (
                                <div key={t.id} className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all">
                                    <div className="aspect-square relative bg-zinc-950/50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={t.image_url}
                                            alt={t.name}
                                            className="w-full h-full object-contain p-4"
                                        />

                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-zinc-900">
                                        <h3 className="font-bold text-sm truncate">{t.name}</h3>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {t.keywords?.map((k, i) => (
                                                <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {templates.length === 0 && (
                                <div className="col-span-full py-12 text-center text-zinc-600">
                                    No templates found. Upload your first one!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
