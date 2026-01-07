'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, Plus } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1>Admin Dashboard</h1>
          <p className="text-zinc-400">
            Manage orders and review customer portraits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/create')}
            className="glass-card p-8 rounded-lg text-left space-y-4 hover:border-[#7C3AED] transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 flex items-center justify-center group-hover:bg-[#7C3AED]/30 transition-colors">
              <Plus className="w-8 h-8" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h2 className="text-2xl mb-2">Create Order</h2>
              <p className="text-zinc-400">
                Add a new customer order with images and details
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/review')}
            className="glass-card p-8 rounded-lg text-left space-y-4 hover:border-[#7C3AED] transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 flex items-center justify-center group-hover:bg-[#7C3AED]/30 transition-colors">
              <ClipboardList className="w-8 h-8" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h2 className="text-2xl mb-2">Review Orders</h2>
              <p className="text-zinc-400">
                Review and approve pending customer orders
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
