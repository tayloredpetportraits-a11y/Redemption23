import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rateLimiter } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limit: 10 requests per 10 seconds
    const isAllowed = rateLimiter.check(ip, 10, 10000);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-me';

    console.log('Login attempt - Password provided:', !!password);
    console.log('Admin password configured:', !!adminPassword);

    if (password === adminPassword) {
      // Generate JWT
      const token = jwt.sign(
        { role: 'admin', timestamp: Date.now() },
        jwtSecret,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({ success: true });

      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      console.log('Login successful, JWT generated and cookie set');
      return response;
    } else {
      console.log('Login failed - incorrect password');
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong on the server. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
