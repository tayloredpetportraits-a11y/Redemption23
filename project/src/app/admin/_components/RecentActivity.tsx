'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import type { Order } from '@/lib/supabase/client';

export default function RecentActivity() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setOrders(data);
            setLoading(false);
        };

        fetchRecent();
    }, [supabase]);

    if (loading) return <div className="h-40 bg-zinc-900/30 rounded-lg animate-pulse" />;

    return (
        <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">Recent Activity</h3>
            </div>
            <div className="divide-y divide-zinc-800/30">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-zinc-300">New Order Created</span>
                            <span className="text-xs text-zinc-500 whitespace-nowrap">
                                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                            <span className="text-zinc-200">{order.customer_name}</span> ordered a portrait for <span className="text-amber-500">{order.pet_name || 'their pet'}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
