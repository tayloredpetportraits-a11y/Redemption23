import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Check, X, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import type { Order, Image as ImageType } from '@/lib/supabase/client';

interface OrderCardProps {
    order: Order;
    images: ImageType[];
    onApproveAll: (orderId: string, imageIds: string[]) => void;
    onReviewImage: (imageId: string, status: 'approved' | 'rejected') => void;
    onExpand: (order: Order) => void;
}

export default function OrderCard({ order, images, onApproveAll, onReviewImage, onExpand }: OrderCardProps) {


    // Filter for pending images to show in the preview grid
    const pendingImages = images.filter(img => img.status === 'pending_review');
    // const completedImages = images.filter(img => img.status !== 'pending');

    // Determine card status color/badge
    const isPendingReview = pendingImages.length > 0;

    return (
        <motion.div
            layout
            className={`glass-card rounded-xl overflow-hidden transition-all hover:border-brand-blue/50 ${isPendingReview ? 'ring-2 ring-brand-navy/10' : ''}`}
        >
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">

                    {/* Main Info */}
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-brand-navy">{order.customer_name}</h3>
                            <span className="text-xs text-zinc-500">{order.customer_email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <span className="text-zinc-700 font-medium">{order.pet_name || 'Pet Swap'}</span>
                            <span>•</span>
                            <span>{order?.product_type || 'Unknown Product'}</span>
                            <span>•</span>
                            <span className="text-zinc-400">{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                        </div>

                        {order.customer_notes && (
                            <div className="mt-3 flex items-start gap-2 text-brand-navy text-sm bg-brand-blue/30 p-3 rounded-lg border border-brand-blue/20">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="line-clamp-2">{order.customer_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                            {isPendingReview ? (
                                <span className="px-3 py-1 rounded-full bg-brand-navy/10 text-brand-navy text-xs font-bold flex items-center gap-1.5 border border-brand-navy/20">
                                    <Clock className="w-3 h-3" />
                                    Needs Review ({pendingImages.length})
                                </span>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'fulfilled'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                    }`}>
                                    {order.status}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isPendingReview && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onApproveAll(order.id, pendingImages.map(i => i.id));
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white font-bold rounded-lg hover:bg-brand-navy/90 transition-colors text-sm shadow-md shadow-brand-navy/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve All
                                </button>
                            )}

                            <button
                                onClick={() => onExpand(order)}
                                className="px-4 py-2 bg-white hover:bg-zinc-50 text-brand-navy border border-zinc-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Details
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pending Images Grid (Inline Preview) */}
                {isPendingReview && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-brand-blue/20"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {/* Reference */}
                            {order.pet_image_url && (
                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-200 opacity-80 hover:opacity-100 transition-opacity">
                                    <Image src={order.pet_image_url} alt="Reference" fill className="object-cover" />
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded font-medium">Ref</div>
                                </div>
                            )}

                            {/* Candidates */}
                            {pendingImages.slice(0, 5).map(img => (
                                <div key={img.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-200 group">
                                    <Image src={img.url} alt="Candidate" fill className="object-cover" />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-brand-navy/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onReviewImage(img.id, 'rejected')}
                                            className="p-2 rounded-full bg-white text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shadow-sm"
                                            title="Reject"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onReviewImage(img.id, 'approved')}
                                            className="p-2 rounded-full bg-white text-brand-navy hover:bg-brand-navy hover:text-white transition-colors shadow-sm"
                                            title="Approve"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-white/90 backdrop-blur-sm border-t border-zinc-100">
                                        <p className="text-[10px] text-zinc-700 truncate">{img.theme_name}</p>
                                    </div>
                                </div>
                            ))}

                            {/* More indicator if needed */}
                            {pendingImages.length > 5 && (
                                <button
                                    onClick={() => onExpand(order)}
                                    className="aspect-[3/4] rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-zinc-500 hover:text-brand-navy hover:bg-zinc-100 transition-colors"
                                >
                                    <span className="text-xl font-bold">+{pendingImages.length - 5}</span>
                                    <span className="text-xs">More</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
