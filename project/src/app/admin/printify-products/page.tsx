'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

interface PrintifyProduct {
    id: string;
    product_name: string;
    product_type: string;
    description: string | null;
    price_cents: number;
    printify_blueprint_id: number;
    printify_print_provider_id: number;
    printify_variant_id: number;
    is_active: boolean;
    display_order: number;
    image_url: string | null;
    mockup_overlay_url: string | null;
    created_at: string;
    updated_at: string;
}

interface ProductFormData {
    product_name: string;
    product_type: string;
    description: string;
    price_cents: number;
    printify_blueprint_id: number;
    printify_print_provider_id: number;
    printify_variant_id: number;
    mockup_overlay_url?: string;
    is_active: boolean;
    display_order: number;
}

export default function PrintifyProductsAdminPage() {
    const [products, setProducts] = useState<PrintifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<PrintifyProduct | null>(null);
    const [testMockupUrl, setTestMockupUrl] = useState<string | null>(null);
    const [testingProduct, setTestingProduct] = useState<string | null>(null);
    const [overlayFile, setOverlayFile] = useState<File | null>(null);
    const [uploadingOverlay, setUploadingOverlay] = useState(false);

    const [formData, setFormData] = useState<ProductFormData>({
        product_name: '',
        product_type: '',
        description: '',
        price_cents: 0,
        printify_blueprint_id: 0,
        printify_print_provider_id: 0,
        printify_variant_id: 0,
        is_active: true,
        display_order: 0
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/printify-products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            alert('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Upload overlay file if one was selected
            let overlayUrl = formData.mockup_overlay_url;
            if (overlayFile) {
                const uploadedUrl = await handleOverlayUpload(overlayFile);
                if (uploadedUrl) {
                    overlayUrl = uploadedUrl;
                } else {
                    throw new Error('Failed to upload overlay image');
                }
            }

            // Prepare final form data with overlay URL
            const dataToSubmit = {
                ...formData,
                mockup_overlay_url: overlayUrl
            };

            const url = editingProduct
                ? `/api/admin/printify-products/${editingProduct.id}`
                : '/api/admin/printify-products';

            const method = editingProduct ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save product');
            }

            await fetchProducts();
            handleCloseForm();
            alert(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Save error:', error);
            alert(error instanceof Error ? error.message : 'Failed to save product');
        }
    };


    const handleEdit = (product: PrintifyProduct) => {
        setEditingProduct(product);
        setFormData({
            product_name: product.product_name,
            product_type: product.product_type,
            description: product.description || '',
            price_cents: product.price_cents,
            printify_blueprint_id: product.printify_blueprint_id,
            printify_print_provider_id: product.printify_print_provider_id,
            printify_variant_id: product.printify_variant_id,
            mockup_overlay_url: product.mockup_overlay_url || undefined,
            is_active: product.is_active,
            display_order: product.display_order
        });
        setShowForm(true);
    };


    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/admin/printify-products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            await fetchProducts();
            alert('Product deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete product');
        }
    };

    const handleToggleActive = async (product: PrintifyProduct) => {
        try {
            const response = await fetch(`/api/admin/printify-products/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !product.is_active })
            });

            if (!response.ok) {
                throw new Error('Failed to toggle product status');
            }

            await fetchProducts();
        } catch (error) {
            console.error('Toggle error:', error);
            alert('Failed to toggle product status');
        }
    };

    const handleTestMockup = async (productType: string) => {
        setTestingProduct(productType);
        setTestMockupUrl(null);

        try {
            const response = await fetch('/api/admin/test-mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productType })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate mockup');
            }

            const data = await response.json();
            setTestMockupUrl(data.mockupUrl);
        } catch (error) {
            console.error('Test mockup error:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate test mockup');
        } finally {
            setTestingProduct(null);
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
            formData.append('bucket', 'product-overlays');

            // Upload via API route (we'll create this next)
            const response = await fetch('/api/admin/upload-overlay', {
                method: 'POST',
                body: formData
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
        setEditingProduct(null);
        setOverlayFile(null);
        setFormData({
            product_name: '',
            product_type: '',
            description: '',
            price_cents: 0,
            printify_blueprint_id: 0,
            printify_print_provider_id: 0,
            printify_variant_id: 0,
            is_active: true,
            display_order: 0
        });
    };


    const formatPrice = (cents: number) => {
        return `$${(cents / 100).toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Printify Products</h1>
                        <p className="text-zinc-400 mt-2">Manage your physical product catalog</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7C3AED]"></div>
                    </div>
                ) : (
                    <div className="bg-zinc-800/50 rounded-lg overflow-hidden backdrop-blur-sm border border-zinc-700">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Blueprint ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Provider ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Variant ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Overlay</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-700">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-zinc-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {product.image_url && (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.product_name}
                                                            className="w-16 h-16 object-cover rounded-lg border border-zinc-600 bg-zinc-900"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-white font-medium">{product.product_name}</div>
                                                        {product.description && (
                                                            <div className="text-sm text-zinc-400 mt-1">{product.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-300 font-mono text-sm">{product.product_type}</td>
                                            <td className="px-6 py-4 text-zinc-300 font-semibold">{formatPrice(product.price_cents)}</td>
                                            <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{product.printify_blueprint_id}</td>
                                            <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{product.printify_print_provider_id}</td>
                                            <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{product.printify_variant_id}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(product)}
                                                    className="flex items-center gap-2"
                                                >
                                                    {product.is_active ? (
                                                        <><CheckCircle className="w-5 h-5 text-green-400" /> <span className="text-green-400">Active</span></>
                                                    ) : (
                                                        <><XCircle className="w-5 h-5 text-zinc-500" /> <span className="text-zinc-500">Inactive</span></>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {product.mockup_overlay_url ? (
                                                    <img
                                                        src={product.mockup_overlay_url}
                                                        alt="Overlay"
                                                        className="w-12 h-12 object-contain bg-zinc-800 rounded border border-zinc-600"
                                                        title="Mockup overlay image"
                                                    />
                                                ) : (
                                                    <span className="text-zinc-600 text-xs">No overlay</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-300">{product.display_order}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleTestMockup(product.product_type)}
                                                        disabled={testingProduct === product.product_type}
                                                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Test Mockup"
                                                    >
                                                        {testingProduct === product.product_type ? (
                                                            <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-[#7DC6FF]" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5 text-zinc-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5 text-red-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-12 text-zinc-400">
                                No products found. Click "Add Product" to create one.
                            </div>
                        )}
                    </div>
                )}

                {/* Test Mockup Preview */}
                <AnimatePresence>
                    {testMockupUrl && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="mt-8 bg-zinc-800/50 rounded-lg p-6 border border-zinc-700"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-white">Test Mockup Preview</h3>
                                <button
                                    onClick={() => setTestMockupUrl(null)}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    Close
                                </button>
                            </div>
                            <img
                                src={testMockupUrl}
                                alt="Test Mockup"
                                className="max-w-2xl w-full rounded-lg shadow-2xl"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Product Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                            onClick={handleCloseForm}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-zinc-700"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Product Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.product_name}
                                                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                                                placeholder="Canvas 11x14"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Product Type * <span className="text-xs text-zinc-500">(lowercase-with-dashes)</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.product_type}
                                                onChange={(e) => setFormData({ ...formData, product_type: e.target.value.toLowerCase() })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-mono"
                                                placeholder="canvas-11x14"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                                            rows={3}
                                            placeholder="Museum-quality canvas print..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Price (USD) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                min="0"
                                                value={formData.price_cents / 100}
                                                onChange={(e) => setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                                                placeholder="49.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Blueprint ID *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.printify_blueprint_id || ''}
                                                onChange={(e) => setFormData({ ...formData, printify_blueprint_id: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-mono"
                                                placeholder="1061"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Provider ID *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.printify_print_provider_id || ''}
                                                onChange={(e) => setFormData({ ...formData, printify_print_provider_id: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-mono"
                                                placeholder="66"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Variant ID *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.printify_variant_id || ''}
                                                onChange={(e) => setFormData({ ...formData, printify_variant_id: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-mono"
                                                placeholder="55537"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Display Order
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.display_order}
                                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                    className="w-5 h-5 rounded border-zinc-700 text-[#7C3AED] focus:ring-[#7C3AED]"
                                                />
                                                <span className="text-zinc-300">Active</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Mockup Overlay Upload */}
                                    <div className="border-t border-zinc-700 pt-4">
                                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                                            Mockup Overlay Image
                                            <span className="text-xs text-zinc-500 ml-2">(PNG with transparency recommended)</span>
                                        </label>

                                        {/* Current overlay preview */}
                                        {formData.mockup_overlay_url && !overlayFile && (
                                            <div className="mb-3 flex items-center gap-3">
                                                <img
                                                    src={formData.mockup_overlay_url}
                                                    alt="Current overlay"
                                                    className="w-20 h-20 object-contain bg-zinc-800 rounded border border-zinc-700"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-zinc-400">Current overlay</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, mockup_overlay_url: undefined })}
                                                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                                                    >
                                                        Remove overlay
                                                    </button>
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
                                                className="block w-full text-sm text-zinc-400
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-[#7C3AED] file:text-white
                                                    hover:file:bg-[#6D28D9]
                                                    file:cursor-pointer cursor-pointer"
                                            />
                                            {overlayFile && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span className="text-green-400">
                                                        {overlayFile.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-zinc-500 mt-2">
                                            💡 Upload a transparent PNG that will overlay on top of pet portraits for instant mockup previews. No API calls needed!
                                        </p>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            className="flex-1 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-semibold transition-colors"
                                        >
                                            {editingProduct ? 'Update Product' : 'Create Product'}
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
