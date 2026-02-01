export class RateLimiter {
    private requests: Map<string, { count: number; expiry: number }> = new Map();

    check(ip: string, limit: number, windowMs: number): boolean {
        const now = Date.now();
        const record = this.requests.get(ip);

        // Clean up expired entry if it exists
        if (record && now > record.expiry) {
            this.requests.delete(ip);
        }

        if (!this.requests.has(ip)) {
            this.requests.set(ip, {
                count: 1,
                expiry: now + windowMs,
            });
            return true;
        }

        const currentsearch = this.requests.get(ip)!;

        // If we're within the window, increment and check limit
        if (now <= currentsearch.expiry) {
            currentsearch.count++;
            if (currentsearch.count > limit) {
                return false;
            }
        } else {
            // If expired (redundant safely check but good for logic flow), reset
            this.requests.set(ip, {
                count: 1,
                expiry: now + windowMs
            });
        }

        return true;
    }

    // Optional: Periodic cleanup to prevent memory leaks from unused IPs
    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.requests.entries()) {
            if (now > record.expiry) {
                this.requests.delete(ip);
            }
        }
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        rateLimiter.cleanup();
    }, 5 * 60 * 1000);
}
