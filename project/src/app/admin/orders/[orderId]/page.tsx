'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import { Loader2, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProReviewModal from '../../_components/ProReviewModal';
import { CheckCheck, Play } from 'lucide-react';

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
    const { orderId } = params;
    const router = useRouter();
    const supabase = createClient();

    const [order, setOrder] = useState<Order | null>(null);
    const [images, setImages] = useState<ImageType[]>([]);
    const [loading, setLoading] = useState(true);
    const [regenLoading, setRegenLoading] = useState<string | null>(null); // Image ID being regenerated
    const [regenPrompt, setRegenPrompt] = useState(''); // Global override prompt for now

    // Review State
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [focusedImageId, setFocusedImageId] = useState<string | null>(null);

    // Helper to open review
    const startReview = () => {
        const nextPending = images.find(i => i.status === 'pending_review');
        if (nextPending) setFocusedImageId(nextPending.id);
        else if (images.length > 0) setFocusedImageId(images[0].id);
        setIsReviewOpen(true);
    };


    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        // 1. Order
        const { data: oData } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (oData) setOrder(oData);

        // 2. Images
        const { data: iData } = await supabase
            .from('images')
            .select('*')
            .eq('order_id', orderId)
            .order('display_order', { ascending: true });
        if (iData) setImages(iData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    // Actions
    const handleRegenerate = async (imageId: string) => {
        if (!confirm("Are you sure? This will overwrite the image with a new generation.")) return;

        setRegenLoading(imageId);
        try {
            const res = await fetch(`/api/admin/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId, promptOverride: regenPrompt || undefined })
            });

            if (!res.ok) throw new Error("Regeneration failed");

            // Refresh
            await fetchData();
        } catch (e) {
            alert("Failed to regenerate: " + e);
        } finally {
            setRegenLoading(null);
        }
    };

    const handleMarkResolved = async () => {
        // Logic to update status to 'fulfilled' (if revising) and prompt email
        // For now just update status
        await supabase.from('orders').update({ status: 'fulfilled' }).eq('id', orderId);
        fetchData();
    };

    const handleSendReadyEmail = async () => {
        if (!confirm("Send 'Portraits Ready' email to customer?")) return;
        try {
            await fetch(`/api/admin/notify-ready`, {
                method: 'POST',
                body: JSON.stringify({ orderId })
            });
            alert("Email queued.");
        } catch (e) {
            alert("Error: " + e);
        }
    };

    const handleEmailAction = async (type: 'request_photo' | 'delay_notification') => {
        const prompts = {
            request_photo: "Send 'Better Photo Needed' email?",
            delay_notification: "Send 'Production Delay' notification?"
        };

        if (!confirm(prompts[type])) return;

        try {
            // Mock API endpoint for now
            console.log(`Sending email type: ${type} to ${order?.customer_email}`);

            // Simulating API call
            await new Promise(r => setTimeout(r, 500));

            alert(`Email parsed and queued: ${type}`);
        } catch (e) {
            alert("Error sending email: " + e);
        }
    };

    const handleReviewImage = async (imageId: string, status: 'approved' | 'rejected') => {
        // Optimistic update
        setImages(prev => prev.map(img => img.id === imageId ? { ...img, status } : img));

        try {
            await fetch('/api/admin/review-queue', {
                method: 'POST',
                body: JSON.stringify({ imageId, status })
            });
        } catch (e) {
            console.error("Review failed", e);
            alert("Failed to save review status");
        }
    };

    const handleApproveAll = async () => {
        const pending = images.filter(i => i.status === 'pending_review');
        if (pending.length === 0) return;

        if (!confirm(`Approve all ${pending.length} pending images?`)) return;

        // Optimistic
        setImages(prev => prev.map(img => img.status === 'pending_review' ? { ...img, status: 'approved' } : img));

        try {
            await Promise.all(pending.map(img =>
                fetch('/api/admin/review-queue', {
                    method: 'POST',
                    body: JSON.stringify({ imageId: img.id, status: 'approved' })
                })
            ));

            // Check if ready
            if (confirm("All images approved! Send 'Portraits Ready' email now?")) {
                handleSendReadyEmail();
            }
        } catch (e) {
            alert("Error approving all: " + e);
            fetchData(); // Rollback/Refresh
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!order) return <div className="p-12 text-center">Order not found</div>;

    return (
        <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/admin/orders')} className="p-2 hover:bg-zinc-800 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-100">{order.customer_name} / {order.pet_name || 'Unnamed Pet'}</h1>
                        <div className="text-sm text-zinc-500 font-mono">{order.id.slice(0, 8)}...</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {images.some(i => i.status === 'pending_review') && (
                        <>
                            <button
                                onClick={startReview}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-bold rounded-lg transition-all animate-pulse"
                            >
                                <Play className="w-4 h-4 text-purple-400" />
                                Start Review
                            </button>
                            <button
                                onClick={handleApproveAll}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-500 font-bold rounded-lg transition-all"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Approve All
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => {
                            const url = `${window.location.origin}/customer/gallery/${order.id}`;
                            navigator.clipboard.writeText(url);
                            alert("Link copied: " + url);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-300 text-sm font-medium"
                    >
                        <span className="hidden sm:inline">Copy Link</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    </button>
                    <button onClick={handleSendReadyEmail} className="btn-secondary flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                        <Mail className="w-4 h-4" />
                    </button>
                    <button onClick={handleMarkResolved} className="btn-primary px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400">
                        Mark Resolved
                    </button>
                </div>
            </div>

            {/* 2 Columns */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* LEFT: Context & Request */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Customer Request</h3>

                        {order.customer_notes ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-amber-200">
                                &quot;{order.customer_notes}&quot;
                            </div>
                        ) : (
                            <div className="text-zinc-600 italic">No notes related to revisions from customer.</div>
                        )}

                        <div className="space-y-2 text-sm text-zinc-400 pt-4 border-t border-zinc-800">
                            <p><strong className="text-zinc-300">Email:</strong> {order.customer_email}</p>
                            <p><strong className="text-zinc-300">Breed:</strong> {order.pet_breed}</p>
                            <p><strong className="text-zinc-300">Details:</strong> {order.pet_details}</p>
                        </div>
                    </div>

                    {/* Communication Tools */}
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Quick Communication</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => handleEmailAction('request_photo')}
                                className="flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                            >
                                <span>📸 Request Better Photo</span>
                                <span className="text-zinc-500 text-xs">Template</span>
                            </button>
                            <button
                                onClick={() => handleEmailAction('delay_notification')}
                                className="flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                            >
                                <span>⏱️ Notify Delay</span>
                                <span className="text-zinc-500 text-xs">Template</span>
                            </button>
                        </div>
                    </div>

                    {/* Revision Controls */}
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Regeneration Settings</h3>
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Prompt Override (Optional)</label>
                            <textarea
                                className="w-full bg-black/50 border border-zinc-700 rounded p-2 text-xs text-zinc-300 h-24"
                                placeholder="e.g. Ensure the eyes are blue..."
                                value={regenPrompt}
                                onChange={e => setRegenPrompt(e.target.value)}
                            />
                            <p className="text-[10px] text-zinc-600 mt-1">
                                Leave empty to use original prompt logic. Text here is appended to the prompt.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Image Grid */}
                <div className="lg:col-span-2 space-y-12">

                    {/* 1. PRIMARY THEME */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <h3 className="font-bold text-zinc-100 uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Primary Theme
                            </h3>
                            <span className="text-xs text-zinc-500">{images.filter(i => i.type === 'primary').length} images</span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.filter(i => i.type === 'primary').map((img) => (
                                <ImageCard
                                    key={img.id}
                                    img={img}
                                    regenLoading={regenLoading}
                                    onRegenerate={handleRegenerate}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 2. BONUS THEMES */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <h3 className="font-bold text-zinc-100 uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Bonus Themes
                            </h3>
                            <span className="text-xs text-zinc-500">{images.filter(i => i.is_bonus || i.type === 'upsell').length} images</span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.filter(i => i.is_bonus || i.type === 'upsell').map((img) => (
                                <ImageCard
                                    key={img.id}
                                    img={img}
                                    regenLoading={regenLoading}
                                    onRegenerate={handleRegenerate}
                                />
                            ))}
                        </div>
                    </section>


                </div>
            </div>
            {/* Pro Review Modal */}
            <ProReviewModal
                focusedImage={isReviewOpen ? images.find(i => i.id === focusedImageId) || images.find(i => i.status === 'pending_review') || images[0] : null}
                onClose={() => setIsReviewOpen(false)}
                currentGroupImages={images}
                order={order}
                onApprove={async (ids) => {
                    // Optimistic
                    setImages(prev => prev.map(img => ids.includes(img.id) ? { ...img, status: 'approved' } : img));
                    try {
                        for (const id of ids) {
                            await fetch('/api/admin/review-queue', {
                                method: 'POST',
                                body: JSON.stringify({ imageId: id, status: 'approved' })
                            });
                        }
                    } catch (e) { alert("Error approving: " + e); }

                    // Auto-Advance
                    const idx = images.findIndex(i => i.id === focusedImageId);
                    if (idx < images.length - 1) setFocusedImageId(images[idx + 1].id);
                }}
                onReject={async (id) => {
                    handleReviewImage(id, 'rejected');
                    const idx = images.findIndex(i => i.id === focusedImageId);
                    if (idx < images.length - 1) setFocusedImageId(images[idx + 1].id);
                }}
                onNext={() => {
                    const idx = images.findIndex(i => i.id === focusedImageId);
                    if (idx < images.length - 1) setFocusedImageId(images[idx + 1].id);
                }}
                onPrev={() => {
                    const idx = images.findIndex(i => i.id === focusedImageId);
                    if (idx > 0) setFocusedImageId(images[idx - 1].id);
                }}
                onSelect={(img) => setFocusedImageId(img.id)}
            />
        </div>
    );
}

// Extracted Component for cleaner code
function ImageCard({ img, regenLoading, onRegenerate }: {
    img: ImageType,
    regenLoading: string | null,
    onRegenerate: (id: string) => void,
}) {
    return (
        <div className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
            <div className="aspect-[4/5] relative">
                <Image
                    src={img.url}
                    alt="Result"
                    fill
                    className={`object-cover transition-opacity ${regenLoading === img.id ? 'opacity-20' : 'opacity-100'}`}
                />

                {/* Status Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-zinc-300 border border-white/10">
                    {img.status}
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-2">

                    {/* Only show Regenerate for non-mockups, or maybe allow re-doing mockups later */}
                    <button
                        disabled={!!regenLoading}
                        onClick={() => onRegenerate(img.id)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={`w-3 h-3 ${regenLoading === img.id ? 'animate-spin' : ''}`} />
                        Regenerate
                    </button>

                    {/* View Full */}
                    <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded flex items-center justify-center gap-2"
                    >
                        View Full
                    </a>
                </div>
            </div>
        </div>
    );
}
