'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from './_components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { replace } = useRouter();

  // Client-side cookie check removed because httpOnly cookies are not accessible.
  // Middleware handles protection.

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-zinc-900">
      <AdminSidebar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
