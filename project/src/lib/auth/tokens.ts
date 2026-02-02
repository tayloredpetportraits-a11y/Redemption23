/**
 * JWT Token Utilities for Secure Order Access
 * 
 * Provides token generation, validation, and access logging
 * for the redemption portal's secure access control system.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TOKEN_EXPIRY = '90d'; // 90 days

interface TokenPayload {
    orderId: string;
    iat?: number;
    exp?: number;
}

interface ValidationResult {
    valid: boolean;
    orderId?: string;
    error?: string;
}

/**
 * Generate a secure access token for an order
 * @param orderId - The order ID to embed in the token
 * @returns JWT token string
 */
export function generateAccessToken(orderId: string): string {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET (SUPABASE_SERVICE_ROLE_KEY) not configured');
    }

    const payload: TokenPayload = {
        orderId,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY,
    });
}

/**
 * Validate an access token and extract the order ID
 * @param token - The JWT token to validate
 * @returns Validation result with orderId if valid
 */
export async function validateAccessToken(token: string): Promise<ValidationResult> {
    if (!JWT_SECRET) {
        return { valid: false, error: 'Server configuration error' };
    }

    try {
        // Verify JWT signature and expiration
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        if (!decoded.orderId) {
            return { valid: false, error: 'Invalid token payload' };
        }

        // Check if token has been revoked
        const tokenHash = hashToken(token);
        const isRevoked = await isTokenRevoked(tokenHash);

        if (isRevoked) {
            await logAccess(decoded.orderId, tokenHash, false, 'revoked');
            return { valid: false, error: 'Token has been revoked' };
        }

        // Log successful access
        await logAccess(decoded.orderId, tokenHash, true);

        return {
            valid: true,
            orderId: decoded.orderId,
        };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            // Try to extract orderId even from expired token for logging
            try {
                const decoded = jwt.decode(token) as TokenPayload;
                if (decoded?.orderId) {
                    await logAccess(decoded.orderId, hashToken(token), false, 'expired');
                }
            } catch {
                // Ignore decode errors
            }
            return { valid: false, error: 'Token has expired' };
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return { valid: false, error: 'Invalid token' };
        }

        console.error('Token validation error:', error);
        return { valid: false, error: 'Token validation failed' };
    }
}

/**
 * Create a SHA-256 hash of a token for privacy in logs
 * @param token - The token to hash
 * @returns Hex-encoded hash
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Check if a token has been manually revoked
 * @param tokenHash - The hashed token to check
 * @returns True if revoked
 */
async function isTokenRevoked(tokenHash: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('revoked_tokens')
            .select('id')
            .eq('token_hash', tokenHash)
            .single();

        return !error && data !== null;
    } catch {
        // If there's an error checking revocation, fail open (allow access)
        // This prevents outages if the revoked_tokens table has issues
        return false;
    }
}

/**
 * Log an access attempt to the database
 * @param orderId - Order ID being accessed
 * @param tokenHash - Hashed token (for privacy)
 * @param success - Whether access was granted
 * @param userAgent - Optional user agent string
 */
async function logAccess(
    orderId: string,
    tokenHash: string,
    success: boolean,
    userAgent?: string
): Promise<void> {
    try {
        const supabase = await createClient();
        await supabase.from('access_logs').insert({
            order_id: orderId,
            token_hash: tokenHash,
            success,
            user_agent: userAgent || null,
        });
    } catch (error) {
        // Log errors but don't throw - logging failures shouldn't break access
        console.error('Failed to log access:', error);
    }
}

/**
 * Manually revoke a token (admin function)
 * @param token - The token to revoke
 * @param reason - Reason for revocation
 */
export async function revokeToken(token: string, reason: string): Promise<void> {
    const tokenHash = hashToken(token);
    const supabase = await createClient();

    await supabase.from('revoked_tokens').insert({
        token_hash: tokenHash,
        reason,
    });
}

/**
 * Get access logs for an order (admin function)
 * @param orderId - Order ID to get logs for
 * @param limit - Maximum number of logs to return
 */
export async function getAccessLogs(orderId: string, limit = 50) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('accessed_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}
