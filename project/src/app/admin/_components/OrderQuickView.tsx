import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, ExternalLink, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { Order, Image as ImageType } from '@/lib/supabase/client';


interface OrderQuickViewProps {
    order: Order;
    images: ImageType[];
    isOpen: boolean;
    onClose: () => void;
    onReviewImage: (imageId: string, status: 'approved' | 'rejected') => void;
}

export default function OrderQuickView({ order, images, isOpen, onClose, onReviewImage }: OrderQuickViewProps) {
    // Separate images by status
    const pendingImages = images.filter(img => img.status === 'pending_review');
    const approvedImages = images.filter(img => img.status === 'approved');
    const rejectedImages = images.filter(img => img.status === 'rejected');

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0.5 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white/95 backdrop-blur-md border-l border-zinc-200 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-200 flex justify-between items-start bg-zinc-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-brand-navy font-playfair">{order.customer_name}</h2>
                                <div className="flex gap-2 text-sm mt-1">
                                    <span className="text-brand-navy/70 font-medium">{order.product_type}</span>
                                    <span className="text-zinc-300">•</span>
                                    <span className="text-zinc-500">{order.pet_name}</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-brand-navy transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Customer Notes */}
                            {order.customer_notes && (
                                <div className="bg-brand-blue/30 border border-brand-blue/20 rounded-xl p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-brand-navy shrink-0" />
                                    <div>
                                        <h4 className="text-brand-navy font-bold text-sm mb-1">Customer Notes</h4>
                                        <p className="text-brand-navy/80 text-sm leading-relaxed">{order.customer_notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reference Photo */}
                            <div>
                                <h3 className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-3">Reference Photo</h3>
                                {order.pet_image_url ? (
                                    <div className="relative aspect-square w-48 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                                        <Image src={order.pet_image_url} alt="Pet Reference" fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-48 h-48 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-200 text-zinc-400">
                                        <ImageIcon className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                            </div>

                            {/* Pending Review Section */}
                            {pendingImages.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-brand-navy font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                            Needs Review
                                            <span className="bg-brand-navy/10 px-2 py-0.5 rounded-full text-brand-navy">{pendingImages.length}</span>
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {pendingImages.map(img => (
                                            <div key={img.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 hover:border-brand-navy transition-colors shadow-sm">
                                                <Image src={img.url} alt="To Review" fill className="object-cover" />

                                                {/* Action Overlay */}
                                                <div className="absolute inset-0 bg-brand-navy/30 backdrop-blur-[1px] group-hover:bg-brand-navy/50 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => onReviewImage(img.id, 'rejected')}
                                                        className="p-3 bg-white text-rose-500 rounded-full shadow-lg hover:bg-rose-500 hover:text-white transition-all font-bold"
                                                        title="Reject"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => onReviewImage(img.id, 'approved')}
                                                        className="p-3 bg-white text-brand-navy rounded-full shadow-lg hover:bg-brand-navy hover:text-white transition-all font-bold"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="absolute bottom-0 inset-x-0 p-3 bg-white/90 backdrop-blur-md border-t border-white/20">
                                                    <span className="text-brand-navy text-sm font-medium">{img.theme_name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Already Approved Section */}
                            {approvedImages.length > 0 && (
                                <div>
                                    <h3 className="text-green-600 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Approved
                                        <span className="bg-green-100 px-2 py-0.5 rounded-full text-green-700">{approvedImages.length}</span>
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {approvedImages.map(img => (
                                            <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-green-200 opacity-90 hover:opacity-100 transition-opacity">
                                                <Image src={img.url} alt="Approved" fill className="object-cover" />
                                                <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full text-white shadow-sm">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rejected Section */}
                            {rejectedImages.length > 0 && (
                                <div>
                                    <h3 className="text-rose-500 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Rejected
                                        <span className="bg-rose-100 px-2 py-0.5 rounded-full text-rose-700">{rejectedImages.length}</span>
                                    </h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {rejectedImages.map(img => (
                                            <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-rose-200 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                                <Image src={img.url} alt="Rejected" fill className="object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <X className="w-8 h-8 text-rose-500 drop-shadow-sm" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-zinc-500 hover:text-brand-navy transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                            <a
                                href={`/admin/orders/${order.id}`} // Assuming detailed page exists
                                className="px-5 py-2 btn-primary rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                Full Order Details
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
