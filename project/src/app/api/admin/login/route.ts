import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('Login attempt - Password provided:', !!password);
    console.log('Admin password configured:', !!adminPassword);

    if (password === adminPassword) {
      const response = NextResponse.json({ success: true });

      response.cookies.set('admin-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      console.log('Login successful, cookie set');
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
