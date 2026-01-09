'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import { Search, Loader2, Inbox, RefreshCcw, CheckCircle2, LayoutGrid, Clock } from 'lucide-react';
import DashboardStats from './_components/DashboardStats';
import OrderCard from './_components/OrderCard';
import OrderQuickView from './_components/OrderQuickView';
import { LayoutGroup, motion } from 'framer-motion';

type Tab = 'needs_review' | 'all' | 'inbox' | 'revising' | 'fulfilled' | 'archived';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [imagesMap, setImagesMap] = useState<Record<string, ImageType[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('needs_review');
  const [search, setSearch] = useState('');

  // Quick View State
  const [quickViewOrder, setQuickViewOrder] = useState<Order | null>(null);

  // Stats Logic (Basic for now)


  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders based on Tab/Search
      let query = supabase.from('orders').select('*');

      if (activeTab === 'needs_review') {
        // "Needs Review" = Orders with pending images. 
        // This is tricky in a single query without complex joins/RPC.
        // Strategy: Fetch 'pending' or 'revising' orders, then filter by those having pending images client-side or use a known status.
        // For now, let's assume 'pending' status implies initial review needed, or we just fetch open orders and filter.
        query = query.neq('status', 'fulfilled').neq('status', 'failed');
      } else if (activeTab === 'inbox') {
        query = query.eq('status', 'pending');
      } else if (activeTab === 'revising') {
        query = query.eq('status', 'revising');
      } else if (activeTab === 'fulfilled') {
        query = query.eq('status', 'fulfilled');
      } else if (activeTab === 'archived') {
        query = query.eq('status', 'failed');
      } else if (activeTab === 'all') {
        query = query.neq('status', 'failed');
      }

      // Search
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,pet_name.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).limit(50); // Pagination later

      const { data: ordersData, error: ordersError } = await query;
      if (ordersError) throw ordersError;

      const fetchedOrders = ordersData || [];

      // 2. Fetch Images for these orders
      // We need images to know if there's anything "pending" to review
      const orderIds = fetchedOrders.map(o => o.id);
      let imagesData: ImageType[] = [];

      if (orderIds.length > 0) {
        const { data: imgs, error: imgError } = await supabase
          .from('images')
          .select('*')
          .in('order_id', orderIds);

        if (imgError) throw imgError;
        imagesData = imgs || [];
      }

      // Group images by Order ID
      const newImagesMap: Record<string, ImageType[]> = {};
      imagesData.forEach(img => {
        if (!newImagesMap[img.order_id]) newImagesMap[img.order_id] = [];
        newImagesMap[img.order_id].push(img);
      });

      // Calculate derived "Needs Review" count locally for the current page? 
      // Better to have specific queries for counts, but for now lets just process the list

      // If "Needs Review" tab, filter strictly to orders having pending images
      let finalOrders = fetchedOrders;
      if (activeTab === 'needs_review') {
        finalOrders = fetchedOrders.filter(order => {
          const orderImages = newImagesMap[order.id] || [];
          return orderImages.some(img => img.status === 'pending_review');
        });
      }

      setOrders(finalOrders);
      setImagesMap(newImagesMap);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleApproveAll = async (orderId: string, imageIds: string[]) => {
    // Optimistic Update
    setImagesMap(prev => {
      const orderImgs = [...(prev[orderId] || [])];
      const updatedImgs = orderImgs.map(img =>
        imageIds.includes(img.id) ? { ...img, status: 'approved' } as ImageType : img
      );
      return { ...prev, [orderId]: updatedImgs };
    });

    // DB Update
    await Promise.all(imageIds.map(id =>
      fetch('/api/admin/review-queue', { // Reusing existing endpoint logic if compatible, or direct DB
        method: 'POST',
        body: JSON.stringify({ imageId: id, status: 'approved' })
      })
    ));

    // Refresh to ensure sync (optional)
    // fetchData(); 
  };

  const handleReviewImage = async (imageId: string, status: 'approved' | 'rejected') => {
    // Find owner order
    let orderId = '';
    for (const [oid, imgs] of Object.entries(imagesMap)) {
      if (imgs.find(i => i.id === imageId)) {
        orderId = oid;
        break;
      }
    }

    if (!orderId) return;

    // Optimistic
    setImagesMap(prev => {
      const orderImgs = [...(prev[orderId] || [])];
      const updatedImgs = orderImgs.map(img =>
        img.id === imageId ? { ...img, status: status } : img
      );
      return { ...prev, [orderId]: updatedImgs };
    });

    // DB
    await fetch('/api/admin/review-queue', { // Use existing review API
      method: 'POST',
      body: JSON.stringify({ imageId: imageId, status })
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy font-playfair">Command Center</h1>
          <p className="text-zinc-500 mt-1">Unified view of all orders and pending reviews</p>
        </div>

        <button
          onClick={() => router.push('/admin/create')}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-navy/20"
        >
          + New Order
        </button>
      </div>

      {/* Stats Logic could go here or remain in component */}
      <div className="hidden md:block">
        <DashboardStats />
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col lg:flex-row gap-4 sticky top-4 z-30 bg-white/80 backdrop-blur-xl p-2 rounded-xl border border-brand-blue/30 shadow-xl shadow-brand-navy/5">
        {/* Tabs */}
        <div className="flex p-1 bg-brand-bg border border-zinc-200 rounded-lg overflow-x-auto no-scrollbar">
          <TabButton
            active={activeTab === 'needs_review'}
            onClick={() => setActiveTab('needs_review')}
            icon={Clock}
            label="Needs Review"
            // badge={counts.needs_review} // Needs real count
            highlight
          />
          <div className="w-px bg-zinc-300 mx-1 my-2" />
          <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} icon={LayoutGrid} label="All active" />
          <TabButton active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} icon={Inbox} label="Inbox" />
          <TabButton active={activeTab === 'revising'} onClick={() => setActiveTab('revising')} icon={RefreshCcw} label="Revising" />
          <TabButton active={activeTab === 'fulfilled'} onClick={() => setActiveTab('fulfilled')} icon={CheckCircle2} label="Fulfilled" />
          <TabButton active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} icon={Inbox} label="Archived" />
        </div>

        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-brand-navy transition-colors" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 text-sm text-brand-navy focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <LayoutGroup>
        <motion.div layout className="space-y-4">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50">
              <p className="text-zinc-500 font-medium">No orders found.</p>
              {activeTab === 'needs_review' && <p className="text-sm text-zinc-400 mt-2">Good job! You&apos;re all caught up.</p>}
            </div>
          ) : (
            orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                images={imagesMap[order.id] || []}
                onApproveAll={handleApproveAll}
                onReviewImage={handleReviewImage}
                onExpand={(o) => setQuickViewOrder(o)}
              />
            ))
          )}
        </motion.div>
      </LayoutGroup>

      {/* Quick View Modal */}
      {quickViewOrder && (
        <OrderQuickView
          order={quickViewOrder}
          images={imagesMap[quickViewOrder.id] || []}
          isOpen={!!quickViewOrder}
          onClose={() => setQuickViewOrder(null)}
          onReviewImage={handleReviewImage}
        />
      )}

    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  highlight?: boolean;
}

function TabButton({ active, onClick, icon: Icon, label, highlight }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap
        ${active
          ? (highlight ? 'bg-brand-navy text-white shadow-md' : 'bg-white text-brand-navy shadow-sm')
          : 'text-zinc-500 hover:text-brand-navy hover:bg-zinc-200/50'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
