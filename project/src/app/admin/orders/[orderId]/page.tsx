'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import { Loader2, RefreshCw, ArrowLeft, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SwipeReviewModal from '../../_components/SwipeReviewModal';
import { CheckCheck, Play } from 'lucide-react';

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
    const { orderId } = params;
    const router = useRouter();
    const supabase = createClient();

    const [order, setOrder] = useState<Order | null>(null);
    const [images, setImages] = useState<ImageType[]>([]);
    const [loading, setLoading] = useState(true);
    const [regenLoading, setRegenLoading] = useState<string | null>(null); // Image ID being regenerated
    const [genMockupLoading, setGenMockupLoading] = useState<string | null>(null);
    const [regenPrompt, setRegenPrompt] = useState(''); // Global override prompt for now

    // Custom Mockup State
    const [customMockupFile, setCustomMockupFile] = useState<File | null>(null);
    const [isCustomMockupLoading, setIsCustomMockupLoading] = useState(false);

    // Review State
    const [isReviewOpen, setIsReviewOpen] = useState(false);


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

    const handleGenerateMockups = async (image: ImageType) => {
        if (!order) return;
        if (!confirm("Generate Canvas, Bear, and Tumbler mockups for this portrait? This may take ~30 seconds.")) return;

        setGenMockupLoading(image.id);
        try {
            const res = await fetch('/api/admin/generate-mockup-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    portraitId: image.id,
                    portraitUrl: image.url
                })
            });

            if (!res.ok) throw new Error("Generation failed");

            alert("Mockups generated successfully!");
            await fetchData();
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setGenMockupLoading(null);
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

    const handleGenerateCustomMockup = async () => {
        if (!customMockupFile) return alert("Please select a file first");

        // Prefer approved primary image, else first primary, else first
        const targetImage = images.find(img => img.type === 'primary' && img.status === 'approved')
            || images.find(img => img.type === 'primary')
            || images[0];

        if (!targetImage) return alert("No portrait to apply mockup to.");

        if (!confirm(`Generate custom mockup using "${customMockupFile.name}" on portrait #${targetImage.id.slice(0, 4)}?`)) return;

        setIsCustomMockupLoading(true);
        try {
            // 1. Upload Template to Supabase (Temp)
            const fileExt = customMockupFile.name.split('.').pop();
            const tempPath = `temp/custom_templates/${Date.now()}.${fileExt}`;

            const formData = new FormData();
            formData.append('file', customMockupFile);
            formData.append('path', tempPath);

            // We need a way to upload from client. 
            // Since we don't have a direct client upload function exposed easily here without import issues,
            // let's just send it to the API as base64 or FormData if the API supports it.
            // Actually, let's just use the API to handle the download if we pass a URL, 
            // BUT we have a local file.
            // Let's make the API accept a file upload or we upload it here.
            // Simplest: Send to a new API route that handles the upload and generation.

            const uploadFormData = new FormData();
            uploadFormData.append('template', customMockupFile);
            uploadFormData.append('orderId', orderId);
            uploadFormData.append('portraitId', targetImage.id);
            uploadFormData.append('portraitUrl', targetImage.url);

            const res = await fetch('/api/admin/generate-mockup-custom', {
                method: 'POST',
                body: uploadFormData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Generation failed");
            }

            alert("Custom mockup generated!");
            setCustomMockupFile(null);
            await fetchData();

        } catch (e) {
            alert("Error: " + e);
        } finally {
            setIsCustomMockupLoading(false);
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
                                onClick={() => setIsReviewOpen(true)}
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
                                    genMockupLoading={genMockupLoading}
                                    onRegenerate={handleRegenerate}
                                    onGenerateMockups={handleGenerateMockups}
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
                                    genMockupLoading={genMockupLoading}
                                    onRegenerate={handleRegenerate}
                                    onGenerateMockups={handleGenerateMockups}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 3. MOCKUPS */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <h3 className="font-bold text-zinc-100 uppercase tracking-widest text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Product Mockups
                            </h3>
                            <span className="text-xs text-zinc-500">{images.filter(i => i.type === 'mockup').length} images</span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Custom Mockup Generator Card */}
                            <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-zinc-800/50 transition-colors">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-300">New Custom Mockup</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Upload a blank product image</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCustomMockupFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="custom-mockup-upload"
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <label
                                        htmlFor="custom-mockup-upload"
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded cursor-pointer w-full"
                                    >
                                        {customMockupFile ? customMockupFile.name.slice(0, 20) + '...' : 'Select Template'}
                                    </label>
                                    {customMockupFile && (
                                        <button
                                            onClick={handleGenerateCustomMockup}
                                            disabled={isCustomMockupLoading}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded w-full flex items-center justify-center gap-2"
                                        >
                                            {isCustomMockupLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Generate
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Existing Mockups */}
                            {images.filter(i => i.type === 'mockup').map((img) => (
                                <ImageCard
                                    key={img.id}
                                    img={img}
                                    regenLoading={regenLoading}
                                    genMockupLoading={genMockupLoading}
                                    onRegenerate={handleRegenerate}
                                    onGenerateMockups={handleGenerateMockups}
                                    isMockup
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
            {/* Swipe Modal */}
            <SwipeReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                images={images}
                onReview={handleReviewImage}
                onComplete={() => {
                    if (confirm("All images reviewed! Send 'Portraits Ready' email now?")) {
                        handleSendReadyEmail();
                    }
                }}
            />
        </div>
    );
}

// Extracted Component for cleaner code
function ImageCard({ img, regenLoading, genMockupLoading, onRegenerate, onGenerateMockups, isMockup }: {
    img: ImageType,
    regenLoading: string | null,
    genMockupLoading: string | null,
    onRegenerate: (id: string) => void,
    onGenerateMockups: (img: ImageType) => void,
    isMockup?: boolean
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
                    {!isMockup && (
                        <button
                            disabled={!!regenLoading || !!genMockupLoading}
                            onClick={() => onRegenerate(img.id)}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-3 h-3 ${regenLoading === img.id ? 'animate-spin' : ''}`} />
                            Regenerate
                        </button>
                    )}

                    {/* Approve (Only for non-mockups/non-approved) - Simplified for this view, assuming auto-approve mostly */}

                    {/* Generate Mockups Button (Approved Primary Only) */}
                    {!isMockup && img.type === 'primary' && img.status === 'approved' && (
                        <button
                            disabled={!!genMockupLoading}
                            onClick={() => onGenerateMockups(img)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2"
                        >
                            {genMockupLoading === img.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            )}
                            Gen Mockups
                        </button>
                    )}

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
