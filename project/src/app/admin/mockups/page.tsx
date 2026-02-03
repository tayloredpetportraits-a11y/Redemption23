'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Layers } from 'lucide-react';

interface MockupTemplate {
    id: string;
    name: string;
    overlay_url: string;
    aspect_ratio: string;
    purchase_link: string;
    is_active: boolean;
    created_at: string;
}

interface TemplateFormData {
    name: string;
    aspect_ratio: string;
    purchase_link: string;
    is_active: boolean;
}

export default function MockupTemplatesPage() {
    const [templates, setTemplates] = useState<MockupTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MockupTemplate | null>(null);
    const [overlayFile, setOverlayFile] = useState<File | null>(null);
    const [uploadingOverlay, setUploadingOverlay] = useState(false);

    const [formData, setFormData] = useState<TemplateFormData>({
        name: '',
        aspect_ratio: 'square',
        purchase_link: '',
        is_active: true,
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/mockups');
            const data = await response.json();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            alert('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Upload overlay file if one was selected
            let overlayUrl = editingTemplate?.overlay_url;
            if (overlayFile) {
                const uploadedUrl = await handleOverlayUpload(overlayFile);
                if (uploadedUrl) {
                    overlayUrl = uploadedUrl;
                } else {
                    throw new Error('Failed to upload overlay image');
                }
            }

            if (!overlayUrl && !editingTemplate) {
                alert('Please upload an overlay image');
                return;
            }

            // Prepare final form data with overlay URL
            const dataToSubmit = {
                ...formData,
                overlay_url: overlayUrl,
            };

            const url = editingTemplate
                ? `/api/admin/mockups/${editingTemplate.id}`
                : '/api/admin/mockups';

            const method = editingTemplate ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save template');
            }

            await fetchTemplates();
            handleCloseForm();
            alert(`Template ${editingTemplate ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Save error:', error);
            alert(error instanceof Error ? error.message : 'Failed to save template');
        }
    };

    const handleEdit = (template: MockupTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            aspect_ratio: template.aspect_ratio,
            purchase_link: template.purchase_link,
            is_active: template.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`/api/admin/mockups/${templateId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete template');
            }

            await fetchTemplates();
            alert('Template deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete template');
        }
    };

    const handleToggleActive = async (template: MockupTemplate) => {
        try {
            const response = await fetch(`/api/admin/mockups/${template.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !template.is_active }),
            });

            if (!response.ok) {
                throw new Error('Failed to toggle template status');
            }

            await fetchTemplates();
        } catch (error) {
            console.error('Toggle error:', error);
            alert('Failed to toggle template status');
        }
    };

    const handleOverlayUpload = async (file: File): Promise<string | null> => {
        setUploadingOverlay(true);

        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please upload an image file (PNG recommended for transparency)');
            }

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            // Upload via API route
            const response = await fetch('/api/admin/upload-overlay', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload overlay');
            }

            const { url } = await response.json();
            return url;
        } catch (error) {
            console.error('Overlay upload error:', error);
            alert(error instanceof Error ? error.message : 'Failed to upload overlay image');
            return null;
        } finally {
            setUploadingOverlay(false);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTemplate(null);
        setOverlayFile(null);
        setFormData({
            name: '',
            aspect_ratio: 'square',
            purchase_link: '',
            is_active: true,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <Layers className="w-10 h-10 text-brand-navy" />
                            Mockup Templates
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Manage your CSS overlay templates for instant mockup generation
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Add Template
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-200"
                            >
                                {/* Overlay Preview */}
                                <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
                                    <img
                                        src={template.overlay_url}
                                        alt={template.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={() => handleToggleActive(template)}
                                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md"
                                        >
                                            {template.is_active ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-slate-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Template Info */}
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-slate-900 mb-2">
                                        {template.name}
                                    </h3>
                                    <div className="space-y-1 text-sm text-slate-600 mb-4">
                                        <p>
                                            <span className="font-medium">Aspect Ratio:</span>{' '}
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                                                {template.aspect_ratio}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">Status:</span>
                                            {template.is_active ? (
                                                <span className="text-green-600 font-medium">Active</span>
                                            ) : (
                                                <span className="text-slate-400 font-medium">Inactive</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-navy rounded-lg transition-colors font-medium"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && templates.length === 0 && (
                    <div className="text-center py-16">
                        <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg">No templates found.</p>
                        <p className="text-slate-500 text-sm mt-1">
                            Click "Add Template" to create your first mockup overlay.
                        </p>
                    </div>
                )}

                {/* Template Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                            onClick={handleCloseForm}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                    {editingTemplate ? 'Edit Template' : 'Add New Template'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Template Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                            placeholder="Ceramic Mug"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Aspect Ratio *
                                            </label>
                                            <select
                                                required
                                                value={formData.aspect_ratio}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, aspect_ratio: e.target.value })
                                                }
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                            >
                                                <option value="square">Square</option>
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </select>
                                        </div>

                                        <div className="flex items-end">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, is_active: e.target.checked })
                                                    }
                                                    className="w-5 h-5 rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
                                                />
                                                <span className="text-slate-700 font-medium">Active</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Purchase Link *
                                        </label>
                                        <input
                                            type="url"
                                            required
                                            value={formData.purchase_link}
                                            onChange={(e) =>
                                                setFormData({ ...formData, purchase_link: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    {/* Overlay Upload */}
                                    <div className="border-t border-slate-200 pt-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-3">
                                            Overlay Image {!editingTemplate && '*'}
                                            <span className="text-xs text-slate-500 ml-2">
                                                (PNG with transparency recommended)
                                            </span>
                                        </label>

                                        {/* Current overlay preview */}
                                        {editingTemplate?.overlay_url && !overlayFile && (
                                            <div className="mb-3 flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                                <img
                                                    src={editingTemplate.overlay_url}
                                                    alt="Current overlay"
                                                    className="w-20 h-20 object-contain bg-white rounded border border-slate-200"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-slate-600">Current overlay</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Upload a new file to replace
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* File input */}
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setOverlayFile(file);
                                                    }
                                                }}
                                                className="block w-full text-sm text-slate-600
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-brand-navy file:text-white
                          hover:file:bg-brand-navy/90
                          file:cursor-pointer cursor-pointer"
                                            />
                                            {overlayFile && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-green-600">{overlayFile.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500 mt-2">
                                            💡 Upload a transparent PNG that will overlay on top of pet
                                            portraits for instant mockup previews.
                                        </p>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={uploadingOverlay}
                                            className="flex-1 px-6 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                        >
                                            {uploadingOverlay
                                                ? 'Uploading...'
                                                : editingTemplate
                                                    ? 'Update Template'
                                                    : 'Create Template'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
