'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PlusCircle,
    Palette,
    Image as ImageIcon,
    LogOut,
    Layers,
    Share2
} from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    };

    const navItems = [
        {
            label: 'Command Center',
            href: '/admin',
            icon: LayoutDashboard,
            exact: true
        },
        {
            label: 'Create Order',
            href: '/admin/create',
            icon: PlusCircle
        },
        {
            label: 'Themes',
            href: '/admin/themes',
            icon: Palette
        },
        {
            label: 'Manage Mockups',
            href: '/admin/products',
            icon: ImageIcon
        },

    ];

    return (
        <aside className="w-64 border-r border-brand-blue/30 bg-white/80 backdrop-blur-xl flex flex-col h-screen sticky top-0 shadow-lg shadow-brand-navy/5">
            <div className="p-6 border-b border-brand-blue/30">
                <h2 className="text-xl font-bold flex items-center gap-2 text-brand-navy font-playfair">
                    <Layers className="w-6 h-6 text-brand-navy" />
                    <span>Admin</span>
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive
                                ? 'bg-brand-navy text-white shadow-md'
                                : 'text-zinc-500 hover:text-brand-navy hover:bg-brand-blue/20'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-brand-blue/30">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-50 transition-all font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
