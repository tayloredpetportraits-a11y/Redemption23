'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Clock, CheckCircle2, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardStats() {
    const [stats, setStats] = useState({
        pending: 0,
        revising: 0,
        fulfilled: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            // In a real production app with many rows, we might use count() queries individually
            // or a dedicated RPC. For now, fetching all and filtering is fine for small scale,
            // or better: independent count queries.

            const countStatus = async (status: string) => {
                const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', status);
                return count || 0;
            };

            const [pending, revising, fulfilled] = await Promise.all([
                countStatus('pending'),
                countStatus('revising'),
                countStatus('fulfilled')
            ]);

            setStats({
                pending,
                revising,
                fulfilled,
                total: pending + revising + fulfilled // Approximate total of active interests
            });
            setLoading(false);
        };

        fetchStats();
    }, [supabase]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-white/50 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
                label="Pending Review"
                value={stats.pending}
                icon={Clock}
                color="text-brand-navy"
                bgColor="bg-white"
                borderColor="border-brand-navy/20"
                shadow="shadow-sm"
            />
            <StatCard
                label="Revisions"
                value={stats.revising}
                icon={RefreshCcw}
                color="text-rose-500"
                bgColor="bg-white"
                borderColor="border-rose-100"
                shadow="shadow-sm"
            />
            <StatCard
                label="Fulfilled"
                value={stats.fulfilled}
                icon={CheckCircle2}
                color="text-green-600"
                bgColor="bg-white"
                borderColor="border-green-100"
                shadow="shadow-sm"
            />
            <StatCard
                label="Total Orders"
                value={stats.total}
                icon={AlertCircle}
                color="text-zinc-500"
                bgColor="bg-white"
                borderColor="border-zinc-200"
                shadow="shadow-sm"
            />
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ label, value, icon: Icon, color, bgColor, borderColor, shadow }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${bgColor} ${borderColor} ${shadow} flex items-center gap-4`}
        >
            <div className={`p-3 rounded-full bg-brand-bg/50 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">{label}</p>
            </div>
        </motion.div>
    );
}
