'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Power, Search, Upload, X, ImageIcon, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import { getThemes, saveThemeToDB, deleteTheme, toggleThemeStatus, type Theme } from '@/app/actions/themes';
import { clsx } from 'clsx';

export default function ThemesPage() {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form States
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');
    const [triggerWord, setTriggerWord] = useState('');
    const [refFiles, setRefFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Dropzone Logic
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setRefFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        multiple: true
    });

    const removeFile = (index: number) => {
        setRefFiles(prev => prev.filter((_, i) => i !== index));
    };

    const loadThemes = async () => {
        setLoading(true);
        try {
            const data = await getThemes();
            setThemes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadThemes();
    }, []);



    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            await toggleThemeStatus(id, !currentStatus);
            setThemes(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async () => {
        setSubmitting(true);
        const supabase = createClient();

        try {
            if (refFiles.length === 0) throw new Error("Please select at least one reference image.");
            if (!newName || !newId) throw new Error("Name and ID are required.");

            // 1. Upload Images Client-Side
            const uploadedUrls: string[] = [];
            const safeId = newId.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');

            // Alert user that upload is starting (optional, but good for feedback since we prevented refresh)
            console.log("Starting upload for", refFiles.length, "images...");

            for (const file of refFiles) {
                const filename = `${safeId}/ref-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;

                const { error: uploadError } = await supabase.storage
                    .from('themes')
                    .upload(filename, file);

                if (uploadError) {
                    console.error("Upload failed for file:", file.name, uploadError);
                    throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('themes')
                    .getPublicUrl(filename);

                uploadedUrls.push(publicUrl);
            }

            // 2. Save Metadata to DB via Server Action
            // Use first image as cover image
            const coverUrl = uploadedUrls[0];

            const result = await saveThemeToDB({
                name: newName,
                id: safeId,
                trigger_word: triggerWord || safeId,
                reference_images: uploadedUrls,
                cover_image_url: coverUrl
            });

            if (result.success) {
                await loadThemes();
                setIsCreateModalOpen(false);
                setNewName('');
                setNewId('');
                setTriggerWord('');
                setRefFiles([]);
                alert('Theme created successfully!');
            }
        } catch (e: any) {
            console.error('Theme Creation Failed:', e);
            alert(`Failed to create theme: ${e.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black p-8 text-zinc-100 font-sans">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">AI Style Manager</h1>
                    <p className="text-zinc-500">Upload reference images to train/guide the AI generation.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" /> New Style
                </button>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {themes.map((theme) => (
                    <div key={theme.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all">
                        {/* Preview Area - Grid of first 4 images */}
                        <div className="aspect-[3/4] relative bg-zinc-950 p-2 grid grid-cols-2 gap-1 overflow-hidden">
                            {theme.reference_images && theme.reference_images.length > 0 ? (
                                theme.reference_images.slice(0, 4).map((img, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-zinc-900">
                                        <Image
                                            src={img}
                                            alt="Ref"
                                            fill
                                            className={clsx("object-cover", !theme.is_active && "opacity-50 grayscale")}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 row-span-2 flex items-center justify-center text-zinc-800">
                                    <ImageIcon className="w-12 h-12 opacity-20" />
                                    {theme.cover_image_url && <Image src={theme.cover_image_url} alt="Cover" fill className="object-cover -z-10 opacity-30" />}
                                </div>
                            )}

                            {/* Overlay Controls */}
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => handleToggle(theme.id, theme.is_active)}
                                    className={clsx(
                                        "p-2 rounded-full backdrop-blur-md transition-colors shadow-xl",
                                        theme.is_active ? "bg-green-500/90 text-white" : "bg-zinc-800 text-zinc-400"
                                    )}
                                    title={theme.is_active ? "Deactivate" : "Activate"}
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (!window.confirm(`Delete style "${theme.name}" permanently? This cannot be undone.`)) return;

                                        // Set a local deleting state if we had one, but for now we can rely on optimistically removing or just waiting
                                        // Since we don't have a per-item loading state in the parent, we'll try to do it via a quick blocking alert or transition
                                        // Better: Let's add a deleting ID state to the component
                                        // But I need to add the state first. 
                                        // For now, I will using a simple busy wait indicator logic if I can edit the component fully.
                                        // I'll assume I can edit the component to add state in a previous step, but I am in replace_file_content.
                                        // I will use `setThemes` to optimistic update immediately? No, that's dangerous if it fails.

                                        try {
                                            await deleteTheme(theme.id);
                                            setThemes(prev => prev.filter(t => t.id !== theme.id));
                                        } catch (err: any) {
                                            console.error("Delete error:", err);
                                            alert('Delete failed: ' + (err.message || "Unknown error"));
                                        }
                                    }}
                                    className="p-2 bg-black/60 text-red-400 rounded-full hover:bg-red-500 hover:text-white backdrop-blur-md transition-colors shadow-xl"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 border-t border-zinc-800">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg text-zinc-100">{theme.name}</h3>
                                <span className="text-[10px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                                    {theme.reference_images?.length || 0} REFS
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <code className="text-[10px] text-zinc-600">ID: {theme.id}</code>
                                <code className="text-[10px] text-amber-500">Trigger: {theme.trigger_word || theme.id}</code>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {themes.length === 0 && !loading && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p>No styles found. Create your first AI Style!</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-6">Connect New Style</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Style Name</label>
                                <input
                                    required
                                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:ring-1 focus:ring-amber-500 outline-none"
                                    placeholder="e.g. Royalty"
                                    value={newName}
                                    onChange={e => {
                                        setNewName(e.target.value);
                                        // Auto-generate ID if empty (replace spaces with hyphens)
                                        if (!newId) setNewId(e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''));
                                        if (!triggerWord) setTriggerWord(e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''));
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Style ID</label>
                                    <input
                                        required
                                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 font-mono text-sm rounded-lg px-4 py-3 focus:ring-1 focus:ring-amber-500 outline-none"
                                        placeholder="royalty"
                                        value={newId}
                                        onChange={e => setNewId(e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-amber-500 mb-1">Trigger Word</label>
                                    <input
                                        required
                                        className="w-full bg-gray-50 border border-amber-500/50 text-gray-900 font-mono text-sm rounded-lg px-4 py-3 focus:ring-1 focus:ring-amber-500 outline-none"
                                        placeholder="royalty"
                                        value={triggerWord}
                                        onChange={e => setTriggerWord(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Reference Images (5+ Recommended)</label>

                                {/* DROPZONE */}
                                <div
                                    {...getRootProps()}
                                    className={clsx(
                                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                                        isDragActive ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className={clsx("w-8 h-8 mb-3", isDragActive ? "text-amber-500" : "text-zinc-500")} />
                                    <p className="text-sm font-medium text-zinc-300">
                                        {isDragActive ? "Drop files now..." : "Drag & Drop 5-10 images here"}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">or click to browse</p>
                                </div>

                                {/* STAGING AREA */}
                                {refFiles.length > 0 && (
                                    <div className="mt-4 grid grid-cols-4 gap-2">
                                        {refFiles.map((file, i) => (
                                            <div key={i} className="group relative aspect-square bg-zinc-800 rounded-md overflow-hidden border border-zinc-700">
                                                <Image
                                                    src={URL.createObjectURL(file)}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(i)}
                                                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {refFiles.length > 0 && (
                                    <div className="mt-2 text-right text-xs text-green-400 font-medium">
                                        {refFiles.length} images selected
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={submitting || refFiles.length === 0}
                                className={clsx(
                                    "w-full py-3 rounded-lg font-medium mt-4 flex justify-center items-center transition-all",
                                    submitting || refFiles.length === 0
                                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                        : "btn-primary"
                                )}
                            >
                                {submitting ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : `Create Style (${refFiles.length} Refs)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
