'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, Loader2, AlertCircle, Inbox, RefreshCcw, CheckCircle2, LayoutGrid } from 'lucide-react';
import type { Order } from '@/lib/supabase/client';

type Tab = 'all' | 'inbox' | 'revising' | 'fulfilled' | 'archived';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const PAGE_SIZE = 20;

    // Tab counts state
    const [counts, setCounts] = useState({ all: 0, inbox: 0, revising: 0, fulfilled: 0, archived: 0 });

    const router = useRouter();
    const supabase = createClient();

    // Helper to refresh data
    const refresh = () => setRefreshTrigger(prev => prev + 1);

    // Fetch Counts (Separate effect to keep them updated)
    useEffect(() => {
        const fetchCounts = async () => {
            // This could be optimized to one RPC call or parallel queries
            const getCount = async (status?: string, excludeArchived = false) => {
                let q = supabase.from('orders').select('*', { count: 'exact', head: true });
                if (status) q = q.eq('status', status);
                if (excludeArchived) q = q.neq('status', 'failed');
                const { count } = await q;
                return count || 0;
            };

            const [all, inbox, revising, fulfilled, archived] = await Promise.all([
                getCount(undefined, true), // All (excluding archived)
                getCount('pending'),
                getCount('revising'),
                getCount('fulfilled'),
                getCount('failed')
            ]);
            setCounts({ all, inbox, revising, fulfilled, archived });
        };
        fetchCounts();
    }, [orders, refreshTrigger]); // Refresh counts when orders change or trigger fires

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            let query = supabase
                .from('orders')
                .select('*', { count: 'exact' });

            // 1. Tab Filtering
            if (activeTab === 'inbox') query = query.eq('status', 'pending');
            else if (activeTab === 'revising') query = query.eq('status', 'revising');
            else if (activeTab === 'fulfilled') query = query.eq('status', 'fulfilled');
            else if (activeTab === 'archived') query = query.eq('status', 'failed');
            else query = query.neq('status', 'failed'); // 'all' hides archived

            // 2. Search Filtering
            if (search) {
                query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,pet_name.ilike.%${search}%`);
            }

            // 3. Pagination
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (data) setOrders(data);
            if (count !== null) setTotalOrders(count);
            if (error) console.error('Error fetching orders:', error);
            setLoading(false);
        };

        // Debounce search slightly
        const timer = setTimeout(() => fetchOrders(), 300);
        return () => clearTimeout(timer);
    }, [supabase, activeTab, search, page, refreshTrigger]);

    // Removed FilteredOrders client-side logic as it is now server-side
    // filteredOrders is now just 'orders' because the fetch is already filtered
    const filteredOrders = orders;

    const toggleSelectAll = () => {
        if (selectedOrderIds.size === filteredOrders.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedOrderIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedOrderIds(newSelected);
    };

    const handleArchiveOrder = async (orderId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent row click
        if (!confirm('Archive this order?')) return;

        const { error } = await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('id', orderId);

        if (!error) {
            refresh();
        } else {
            console.error('Error archiving:', error);
            alert('Failed to archive order');
        }
    };

    const handleBulkAction = async (action: 'fulfill' | 'archive' | 'email' | 'delete') => {
        if (action === 'delete') {
            if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedOrderIds.size} orders? This cannot be undone.`)) return;
        } else {
            if (!confirm(`Are you sure you want to ${action} ${selectedOrderIds.size} orders?`)) return;
        }

        console.log(`Executing ${action} on`, Array.from(selectedOrderIds));

        if (action === 'fulfill') {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'fulfilled' })
                .in('id', Array.from(selectedOrderIds));

            if (!error) {
                refresh();
                setSelectedOrderIds(new Set());
                alert('Orders marked as fulfilled!');
            }
        } else if (action === 'archive') {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'failed' }) // Using 'failed' as internal state for Archived
                .in('id', Array.from(selectedOrderIds));

            if (!error) {
                refresh();
                setSelectedOrderIds(new Set());
                alert('Orders archived!');
            }
        } else if (action === 'delete') {
            const { error } = await supabase
                .from('orders')
                .delete()
                .in('id', Array.from(selectedOrderIds));

            if (!error) {
                refresh();
                setSelectedOrderIds(new Set());
                alert('Orders permanently deleted.');
            } else {
                console.error('Error deleting orders:', error);
                alert('Failed to delete orders. Check console for details.');
            }
        } else {
            alert(`${action} action triggered (Not fully implemented yet)`);
        }
    };

    return (
        <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-100">All Orders</h1>
                    <p className="text-zinc-500">Manage, review, and fix customer orders</p>
                </div>
                <button
                    onClick={() => router.push('/admin/create')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                    + New Order
                </button>
            </div>

            {/* Tabs & Search Row */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                {/* Tabs */}
                <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-x-auto no-scrollbar">
                    <TabButton
                        active={activeTab === 'all'}
                        onClick={() => { setActiveTab('all'); setPage(1); }}
                        icon={LayoutGrid}
                        label="All Orders"
                        count={counts.all}
                    />
                    <TabButton
                        active={activeTab === 'inbox'}
                        onClick={() => { setActiveTab('inbox'); setPage(1); }}
                        icon={Inbox}
                        label="Inbox"
                        count={counts.inbox}
                    />
                    <TabButton
                        active={activeTab === 'revising'}
                        onClick={() => { setActiveTab('revising'); setPage(1); }}
                        icon={RefreshCcw}
                        label="In Progress"
                        count={counts.revising}
                    />
                    <TabButton
                        active={activeTab === 'fulfilled'}
                        onClick={() => { setActiveTab('fulfilled'); setPage(1); }}
                        icon={CheckCircle2}
                        label="Completed"
                        count={counts.fulfilled}
                    />
                    <TabButton
                        active={activeTab === 'archived'}
                        onClick={() => { setActiveTab('archived'); setPage(1); }}
                        icon={Inbox}
                        label="Archived"
                        count={counts.archived}
                    />
                </div>

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or pet..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <p className="text-zinc-500">No orders found.</p>
                </div>
            ) : (
                <>
                    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-900 text-zinc-200 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                                        />
                                    </th>
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Customer</th>
                                    <th className="p-4 font-medium">Pet</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={`hover:bg-zinc-800/50 cursor-pointer transition-colors ${selectedOrderIds.has(order.id) ? 'bg-amber-500/5' : ''}`}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                            if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                                            router.push(`/admin/orders/${order.id}`);
                                        }}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrderIds.has(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500"
                                            />
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                                            <div className="text-xs text-zinc-600">{format(new Date(order.created_at), 'h:mm a')}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-zinc-200">{order.customer_name}</div>
                                            <div className="text-xs">{order.customer_email}</div>
                                        </td>
                                        <td className="p-4">
                                            {order.pet_name || <span className="text-zinc-600 italic">No name</span>}
                                            <div className="text-xs text-zinc-500">{order.pet_breed}</div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={order.status} />
                                            {order.customer_notes && (
                                                <div className="flex items-center gap-1 text-amber-500 text-xs mt-1 font-bold">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Has Feedback
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 flex items-center gap-3">
                                            <span className="text-amber-500 hover:text-amber-400 font-medium">
                                                Manage &rarr;
                                            </span>
                                            {activeTab !== 'archived' && (
                                                <button
                                                    onClick={(e) => handleArchiveOrder(order.id, e)}
                                                    className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
                                                    title="Archive Order"
                                                >
                                                    Archive
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                        <div className="text-sm text-zinc-500">
                            Showing <span className="font-medium text-zinc-300">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
                            <span className="font-medium text-zinc-300">{Math.min(page * PAGE_SIZE, totalOrders)}</span> of{' '}
                            <span className="font-medium text-zinc-300">{totalOrders}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * PAGE_SIZE >= totalOrders}
                                className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Bulk Actions Bar */}
            {selectedOrderIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 z-50">
                    <span className="text-zinc-300 font-medium text-sm">{selectedOrderIds.size} selected</span>
                    <div className="h-4 w-px bg-zinc-700" />
                    <button
                        onClick={() => handleBulkAction('fulfill')}
                        className="text-amber-500 hover:text-amber-400 font-medium text-sm"
                    >
                        Mark Fulfilled
                    </button>
                    <button
                        onClick={() => handleBulkAction('email')}
                        className="text-zinc-400 hover:text-zinc-200 text-sm"
                    >
                        Send Email
                    </button>
                    <button
                        onClick={() => handleBulkAction('archive')}
                        className="text-zinc-400 hover:text-red-400 text-sm"
                    >
                        Archive
                    </button>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="text-red-500 hover:text-red-400 text-sm font-medium ml-2"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => setSelectedOrderIds(new Set())}
                        className="ml-2 text-zinc-500 hover:text-zinc-300"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabButton({ active, onClick, icon: Icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap
                ${active
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800 text-zinc-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        fulfilled: 'bg-green-500/10 text-green-500 border-green-500/20',
        revising: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        failed: 'bg-zinc-800 text-zinc-500 border-zinc-700', // Archived style
    };
    const defaultStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[status] || defaultStyle}`}>
            {status === 'failed' ? 'Archived' : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
