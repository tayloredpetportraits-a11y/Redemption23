'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, ClipboardList, Plus } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <nav className="glass-card border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl">Admin Portal</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/admin/review')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    pathname === '/admin/review'
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Review Queue
                </button>
                <button
                  onClick={() => router.push('/admin/create')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    pathname === '/admin/create'
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Create Order
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
