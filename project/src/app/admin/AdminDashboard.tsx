'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Eye, Loader2, Search, Filter, Camera, CheckCircle, AlertTriangle, CloudLightning } from 'lucide-react';
import ReviewGrid from './ReviewGrid';
import PugLoader from '@/components/PugLoader';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import Image from 'next/image';

interface AdminDashboardProps {
    initialOrders: Order[];
    images: ImageType[];
}

export default function AdminDashboard({ initialOrders, images }: AdminDashboardProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = orders.filter(o =>
        o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.includes(searchTerm)
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Delivered</span>;
            case 'pending_review': return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Review Needed</span>;
            case 'generating': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><CloudLightning className="w-3 h-3" /> Generating</span>;
            case 'revising': return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Camera className="w-3 h-3" /> Revising</span>;
            default: return <span className="bg-zinc-100 text-zinc-500 text-xs px-2 py-1 rounded-full font-bold">{status}</span>;
        }
    };

    // If Review Mode
    if (reviewOrder) {
        // REMOVED BLOCKING LOADER per user request.
        // We now always fall through to the main ReviewGrid view.


        const orderImages = images.filter(i => i.order_id === reviewOrder.id);
        const ordersMap = { [reviewOrder.id]: reviewOrder };

        return (
            <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
                <div className="sticky top-0 z-[101] flex items-center justify-between p-4 bg-zinc-900 text-white shadow-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setReviewOrder(null)}
                            className="text-sm font-bold hover:text-zinc-300 flex items-center gap-2"
                        >
                            ← Back to Dashboard
                        </button>
                        <span className="text-zinc-500">|</span>
                        <h2 className="font-bold">Reviewing: {reviewOrder.pet_name}</h2>
                    </div>
                </div>
                <ReviewGrid
                    images={orderImages}
                    orders={ordersMap}
                    loading={['generating', 'pending', 'processing_print'].includes(reviewOrder.status)}
                    onApprove={async (ids) => {
                        // Optimistic Update could go here, but for now just call action
                        // We iterate because ReviewGrid passes array
                        // But for now, let's just loop locally or assume bulk action
                        try {
                            // Dynamically import to avoid server-client boundary issues if simple import fails
                            // But we can just use the imported actions if we marked them 'use server'
                            // Need to Import them at top of file first!
                            const { approveImage, rejectAndRegenerate } = await import('@/app/actions/image-approval');

                            for (const id of ids) {
                                await approveImage(id);
                            }
                            // Trigger router refresh to update UI
                            window.location.reload(); // Simple brute force for now to ensure data consistency
                        } catch (e) {
                            alert("Error approving: " + e);
                        }
                    }}
                    onReject={async (id) => {
                        try {
                            const { rejectAndRegenerate } = await import('@/app/actions/image-approval');
                            if (confirm("Reject and Regenerate this image?")) {
                                await rejectAndRegenerate(id);
                                window.location.reload();
                            }
                        } catch (e) {
                            alert("Error rejecting: " + e);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">Orders Dashboard</h1>
                    <p className="text-zinc-500">Manage order production and reviews.</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            className="pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50">
                        <Filter className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500 font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Order ID / Date</th>
                            <th className="px-6 py-4">Customer & Pet</th>
                            <th className="px-6 py-4">Theme</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {filteredOrders.map(order => (
                            <tr
                                key={order.id}
                                onClick={() => setReviewOrder(order)}
                                className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-mono text-xs text-zinc-500">#{order.id.slice(0, 8)}</div>
                                    <div className="text-sm text-zinc-400">{new Date(order.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200">
                                            {order.pet_image_url ? (
                                                <Image src={order.pet_image_url} alt="Pet" width={40} height={40} className="object-cover w-full h-full" />
                                            ) : (
                                                <span className="text-lg">🐶</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-900">{order.customer_name}</div>
                                            <div className="text-xs text-zinc-500">{order.pet_name} ({order.pet_breed || 'Unknown'})</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-block px-2 py-1 bg-zinc-100 rounded text-xs text-zinc-600 font-medium">
                                        {order.theme_id || 'Random'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(order.status)}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    {/* Action Logic */}
                                    {order.status === 'pending_review' || order.status === 'revising' || order.status === 'generating' ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReviewOrder(order); }}
                                            className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-2 ml-auto"
                                        >
                                            Review Images
                                        </button>
                                    ) : order.status === 'completed' ? (
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setReviewOrder(order); }}
                                                className="text-zinc-400 hover:text-zinc-900 text-xs font-bold px-2"
                                            >
                                                Edit
                                            </button>
                                            <a
                                                href={`/portal/${order.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-blue/20 transition-colors flex items-center gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Eye className="w-4 h-4" /> Portal
                                            </a>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReviewOrder(order); }}
                                            className="text-zinc-400 text-xs italic hover:text-zinc-900"
                                        >
                                            Processing...
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
