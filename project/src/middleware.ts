import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs in Edge runtime, so we can't use jsonwebtoken (requires Node.js crypto)
// We'll just check for cookie presence here, actual JWT verification happens in API routes
export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin-token')?.value;
  const isAuthenticated = !!token; // Just check if token exists

  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
