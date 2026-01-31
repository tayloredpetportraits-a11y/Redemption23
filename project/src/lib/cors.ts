import { NextRequest, NextResponse } from 'next/server';

const getAllowedOrigins = () => process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

/**
 * Helper to determine if an origin is allowed.
 * Defaults to stricter security in production.
 */
function isOriginAllowed(origin: string | null): boolean {
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    const allowedOrigins = getAllowedOrigins();

    // If no origin (e.g. server-to-server or same-origin), allow it.
    // In production, you might want to be stricter for same-origin if needed,
    // but typically same-origin requests send their origin or referer.
    if (!origin) return true;

    if (allowedOrigins.includes('*')) return true;

    return allowedOrigins.includes(origin);
}

/**
 * Generates CORS headers for a given request.
 */
export function corsHeaders(request: NextRequest): HeadersInit {
    const origin = request.headers.get('origin');
    const headers: HeadersInit = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24 hours
    };

    if (isOriginAllowed(origin)) {
        // Reflect the origin if it's allowed, or use '*' if configured (and not sending credentials).
        // Ideally, for credentials support (cookies), validation must be specific and cannot be '*'.
        // We will reflect the specific origin if allowed.
        if (origin) {
            headers['Access-Control-Allow-Origin'] = origin;
        } else {
            // Fallback or specific case handling
            headers['Access-Control-Allow-Origin'] = '*';
        }
    }

    return headers;
}

/**
 * Standard OPTIONS handler for preflight requests.
 */
export function handleOptions(request: NextRequest) {
    return NextResponse.json({}, { headers: corsHeaders(request) });
}

/**
 * Higher-order function to wrap API route handlers with CORS headers.
 * Usage: export const POST = withCors(async (req) => { ... });
 */
export function withCors(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse) {
    return async (request: NextRequest, ...args: any[]) => {
        const response = await handler(request, ...args);

        // If the handler didn't fail/throw (caught internally), append CORS headers.
        // If it threw, Next.js error boundary might catch it, so this wrapper helps for successful/handled responses.
        const headers = corsHeaders(request);

        Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value as string);
        });

        return response;
    };
}
