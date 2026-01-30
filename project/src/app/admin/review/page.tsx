'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Image as ImageType } from '@/lib/supabase/client';
import ReviewDeck from './ReviewDeck';

export default function AdminReviewPage() {
  const [queue, setQueue] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPendingImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .in('status', ['pending', 'pending_review']) // Handle both legacy and new
      .order('created_at', { ascending: true }); // Oldest first

    if (error) {
      console.error('Error fetching images:', error);
    } else {
      setQueue(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modified to handle single ID for the Deck view
  const handleApprove = async (id: string) => {
    // Optimistic Update
    setQueue(current => current.filter(img => img.id !== id));

    const { error } = await supabase
      .from('images')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      console.error("Failed to approve", error);
      fetchPendingImages(); // Revert/Reload on error
    }
  };

  const handleReject = async (id: string) => {
    setQueue(current => current.filter(img => img.id !== id));

    const { error } = await supabase
      .from('images')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      console.error("Failed to reject", error);
      fetchPendingImages();
    }
  };

  return (
    <ReviewDeck
      images={queue}
      loading={loading}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
