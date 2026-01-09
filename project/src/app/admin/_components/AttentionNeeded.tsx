'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Order } from '@/lib/supabase/client';

export default function AttentionNeeded() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchAttentionOrders = async () => {
            // Fetch oldest 5 orders that are pending or revising
            const { data } = await supabase
                .from('orders')
                .select('*')
                .in('status', ['pending', 'revising'])
                .order('created_at', { ascending: true }) // Oldest first
                .limit(5);

            if (data) setOrders(data);
            setLoading(false);
        };

        fetchAttentionOrders();
    }, [supabase]);

    if (loading) return <div className="h-40 bg-zinc-900/30 rounded-lg animate-pulse" />;

    if (orders.length === 0) {
        return (
            <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-lg text-center">
                <p className="text-zinc-500">No urgent orders! 🎉</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Attention Needed
                </h3>
                <span className="text-xs text-zinc-500">Oldest outstanding orders</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="p-4 flex items-center justify-between hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${order.status === 'revising' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div>
                                <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                    {order.customer_name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {order.pet_name || 'No Pet Name'} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                ))}
            </div>
        </div>
    );
}
