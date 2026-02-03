'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Palette, Settings, LogOut, Layers } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard }, // Points to Master Orders View
  { name: 'Mockup Templates', href: '/admin/mockups', icon: Layers },
  { name: 'Themes', href: '/admin/themes', icon: Palette },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Client-side Auth Guard (Backup to Middleware)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { replace } = require('next/navigation').useRouter();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Auth check logic if needed
  }, [pathname, replace]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-zinc-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700 shrink-0 bg-slate-800">
            <Image
              src="/logo.gif"
              alt="Taylored Pet Portraits"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Taylored HQ</h1>
            <p className="text-slate-500 text-xs">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 max-w-[1600px] w-full mx-auto ml-64">
        {children}
      </main>
    </div>
  );
}
