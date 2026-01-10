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

  useEffect(() => {
    // Simple check for the cookie. For stricter check, we rely on API calls or Middleware.
    if (!document.cookie.includes('admin-token=authenticated')) {
      // verify we are not already on login (handled above)
      if (pathname !== '/admin/login') {
        replace('/admin/login');
      }
    }
  }, [pathname, replace]);

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
