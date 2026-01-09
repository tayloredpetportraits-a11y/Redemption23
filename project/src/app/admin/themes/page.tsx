'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Play, Upload, Loader2, FolderPlus, Trash2, X, Grid } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface Theme {
    id: string;
    name: string;
    imageCount: number;
    previewImage: string | null;
}

interface ThemeImage {
    name: string;
    url: string;
}

function ManageThemeModal({ theme, type, onClose, onImageDeleted }: { theme: Theme, type: 'portrait' | 'mockup', onClose: () => void, onImageDeleted: () => void }) {
    const [images, setImages] = useState<ThemeImage[]>([]);
    const [loading, setLoading] = useState(true);

    const loadImages = useCallback(() => {
        setLoading(true);
        fetch(`/api/admin/themes/details?id=${theme.id}&type=${type}`)
            .then(res => res.json())
            .then(data => setImages(data.images || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [theme.id, type]);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const handleDeleteImage = async (filename: string) => {
        if (!confirm('Delete this image?')) return;

        try {
            const res = await fetch('/api/admin/themes/images/delete', {
                method: 'POST',
                body: JSON.stringify({ themeId: theme.id, filename, type })
            });

            if (res.ok) {
                loadImages();
                onImageDeleted(); // Trigger refresh on parent
            } else {
                alert('Failed to delete image');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting image');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-4xl h-[80vh] flex flex-col"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-zinc-100">Manage {theme.name}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">Loading images...</div>
                    ) : images.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">No images found. Upload some!</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map((img) => (
                                <div key={img.name} className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                                    <Image src={img.url} alt={img.name} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => handleDeleteImage(img.name)}
                                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                                            title="Delete Image"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-black/80 text-[10px] text-zinc-400 truncate">
                                        {img.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function ThemeCard({ theme, onTest, onUpload, onDelete, onManage }: {
    theme: Theme,
    onTest: (id: string) => void,
    onUpload: (id: string, files: File[]) => Promise<void>,
    onDelete: (id: string) => void,
    onManage: (theme: Theme) => void
}) {
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setIsUploading(true);
            await onUpload(theme.id, acceptedFiles);
            setIsUploading(false);
        }
    }, [theme.id, onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected: (fileRejections) => {
            const errors = fileRejections.map(r => `${r.file.name}: ${r.errors.map(e => e.message).join(', ')}`).join('\n');
            alert(`Files rejected:\n${errors}`);
        },
        noClick: false, // Allow click to select files on the zone
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }
    });

    return (
        <div className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group">

            {/* Image Area - Contains Dropzone + Overlay Buttons */}
            <div className="aspect-square relative bg-zinc-950">

                {/* Dropzone Layer */}
                <div {...getRootProps()} className={`absolute inset-0 z-10 cursor-pointer ${isDragActive ? 'ring-2 ring-amber-500/50' : ''}`}>
                    <input {...getInputProps()} />
                    {theme.previewImage ? (
                        <Image src={theme.previewImage} alt={theme.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 gap-2">
                            <Upload className="w-8 h-8 opacity-20" />
                            <span className="text-xs">Drop images to start</span>
                        </div>
                    )}

                    {/* Uploading Overlay */}
                    <AnimatePresence>
                        {(isDragActive || isUploading) && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                                        <span className="text-amber-500 font-bold">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-amber-500 mb-2" />
                                        <span className="text-zinc-200 font-bold">Drop Images Here</span>
                                        <span className="text-zinc-500 text-xs">to add to {theme.name}</span>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Info Pills (Pointer events none to let clicks pass through to dropzone, or position carefully) */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-mono backdrop-blur-sm z-20 pointer-events-none">
                    {theme.imageCount} items
                </div>

                {/* Management Buttons - Sits ON TOP of dropzone (z-20) */}
                <div className="absolute top-2 right-2 flex gap-1 z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(theme.id); }}
                        className="p-1.5 bg-black/60 hover:bg-red-500/80 hover:text-white rounded text-zinc-400 backdrop-blur-sm transition-colors shadow-lg"
                        title="Delete Theme"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onManage(theme); }}
                        className="p-1.5 bg-black/60 hover:bg-zinc-700 hover:text-white rounded text-zinc-200 backdrop-blur-sm transition-colors shadow-lg"
                        title="Manage Images"
                    >
                        <Grid className="w-3.5 h-3.5" />
                    </button>
                </div>

            </div>

            <div className="p-4 relative z-20 bg-zinc-900">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-zinc-200">{theme.name}</h3>
                        <p className="text-xs text-zinc-500">ID: {theme.id}</p>
                    </div>
                </div>

                <button
                    onClick={() => onTest(theme.id)}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Play className="w-3 h-3" /> Test Order
                </button>
            </div>
        </div>
    );
}

export default function ThemesPage() {
    const [activeTab, setActiveTab] = useState<'portrait' | 'mockup'>('portrait');
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [testingTheme, setTestingTheme] = useState<string | null>(null);
    void testingTheme;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [managingTheme, setManagingTheme] = useState<Theme | null>(null);
    const [newThemeName, setNewThemeName] = useState('');

    const loadThemes = useCallback(() => {
        setLoading(true);
        const endpoint = activeTab === 'portrait' ? '/api/admin/themes' : '/api/admin/mockup-themes';

        fetch(endpoint)
            .then(res => res.json())
            .then(data => setThemes(data.themes))
            .catch(err => console.error('Failed to load themes:', err))
            .finally(() => setLoading(false));
    }, [activeTab]);

    useEffect(() => {
        loadThemes();
    }, [loadThemes]);

    const handleTestTheme = async (themeId: string) => {
        if (activeTab === 'mockup') return;

        setTestingTheme(themeId);
        try {
            await fetch('/api/admin/seed', {
                method: 'POST',
                body: JSON.stringify({ theme: themeId })
            });
            window.location.href = '/admin/review';
        } catch (error) {
            console.error(error);
            alert('Failed to start test');
        } finally {
            setTestingTheme(null);
        }
    };

    const handleUpload = async (themeId: string, files: File[]) => {
        const formData = new FormData();
        formData.append('themeId', themeId);
        files.forEach(f => formData.append('files', f));

        const endpoint = activeTab === 'portrait' ? '/api/admin/themes/upload' : '/api/admin/mockup-themes/upload';
        console.log(`Uploading to ${endpoint} for theme ${themeId}`);

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                loadThemes();
                alert(`Upload Successful: ${files.length} files`);
            } else {
                const errText = await res.text();
                console.error('Upload failed response:', errText);
                alert(`Upload failed: ${res.status} ${res.statusText}\n${errText}`);
            }
        } catch (e) {
            console.error(e);
            alert(`Upload error: ${e}`);
        }
    };

    const handleDeleteTheme = async (themeId: string) => {
        if (!confirm('Are you sure you want to delete this theme? This action cannot be undone.')) return;

        try {
            const res = await fetch('/api/admin/themes/delete', {
                method: 'POST',
                body: JSON.stringify({ themeId, type: activeTab })
            });

            if (res.ok) {
                loadThemes();
            } else {
                alert('Failed to delete theme');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting theme');
        }
    };

    const handleCreateTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = activeTab === 'portrait' ? '/api/admin/themes/create' : '/api/admin/mockup-themes/create';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ name: newThemeName })
            });
            if (res.ok) {
                setNewThemeName('');
                setShowCreateModal(false);
                loadThemes();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating theme');
        }
    };

    if (loading && themes.length === 0) return <div className="p-8 text-zinc-400">Loading themes...</div>;

    return (
        <div className="min-h-screen bg-zinc-950 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100 mb-1">Theme Library</h1>
                    <p className="text-zinc-500 text-sm">Manage your portrait styles and product mockups.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-zinc-900 p-1 rounded-lg flex border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('portrait')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'portrait'
                                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Portraits
                        </button>
                        <button
                            onClick={() => setActiveTab('mockup')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'mockup'
                                ? 'bg-amber-900/40 text-amber-200 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Mockups
                        </button>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
                    >
                        <FolderPlus className="w-4 h-4" />
                        New {activeTab === 'portrait' ? 'Theme' : 'Product'}
                    </button>
                </div>
            </div>

            <div className="mb-6">
                {activeTab === 'mockup' && (
                    <div className="bg-amber-900/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Upload your blank product images (T-Shirts, Mugs, etc) here to use them in Nano Banana Pro.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {themes.map(theme => (
                    <ThemeCard
                        key={theme.id}
                        theme={theme}
                        onTest={handleTestTheme}
                        onUpload={handleUpload}
                        onDelete={handleDeleteTheme}
                        onManage={setManagingTheme}
                    />
                ))}
            </div>

            {themes.length === 0 && !loading && (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-zinc-500 mb-2">No {activeTab} themes found.</p>
                    <button onClick={() => setShowCreateModal(true)} className="text-amber-500 hover:underline">
                        Create your first {activeTab === 'portrait' ? 'theme' : 'mockup product'}
                    </button>
                </div>
            )}

            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm"
                        >
                            <h2 className="text-lg font-bold text-zinc-100 mb-4">
                                Create New {activeTab === 'portrait' ? 'Theme' : 'Mockup Product'}
                            </h2>
                            <form onSubmit={handleCreateTheme}>
                                <input
                                    autoFocus
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 mb-4 focus:border-amber-500 outline-none"
                                    placeholder={activeTab === 'portrait' ? "Theme Name (e.g. Superhero)" : "Product Name (e.g. White T-Shirt)"}
                                    value={newThemeName}
                                    onChange={(e) => setNewThemeName(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-zinc-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newThemeName.trim()}
                                        className="btn-primary px-4 py-2 rounded"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {managingTheme && (
                    <ManageThemeModal
                        theme={managingTheme}
                        type={activeTab}
                        onClose={() => setManagingTheme(null)}
                        onImageDeleted={loadThemes}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
