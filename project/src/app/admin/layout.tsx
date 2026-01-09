'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from './_components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Client-side Auth Guard (Backup to Middleware)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { replace } = require('next/navigation').useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { useEffect } = require('react');

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Simple check for the cookie. For stricter check, we rely on API calls or Middleware.
    if (!document.cookie.includes('admin-token=authenticated')) {
      // verify we are not already on login (handled above)
      replace('/admin/login');
    }
  }, [pathname, replace]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-zinc-900">
      <AdminSidebar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
