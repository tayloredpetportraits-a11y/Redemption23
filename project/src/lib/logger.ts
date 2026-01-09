export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: unknown;
    context?: string;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private format(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data instanceof Error ? { name: data.name, message: data.message, stack: data.stack } : data,
            context,
        };
    }

    private print(entry: LogEntry) {
        if (this.isDevelopment) {
            const color = {
                info: '\x1b[36m', // Cyan
                warn: '\x1b[33m', // Yellow
                error: '\x1b[31m', // Red
                debug: '\x1b[90m', // Gray
            }[entry.level];
            const reset = '\x1b[0m';

            const contextStr = entry.context ? `[${entry.context}] ` : '';
            console.log(`${color}${entry.level.toUpperCase()}${reset} ${contextStr}${entry.message}`);
            if (entry.data) console.log(entry.data);
        } else {
            // In production, you would send this to a service like Datadog, Sentry, etc.
            // For now, we still log to stdout for server logs to pick up.
            console.log(JSON.stringify(entry));
        }
    }

    info(message: string, data?: unknown, context?: string) {
        this.print(this.format('info', message, data, context));
    }

    warn(message: string, data?: unknown, context?: string) {
        this.print(this.format('warn', message, data, context));
    }

    error(message: string, data?: unknown, context?: string) {
        this.print(this.format('error', message, data, context));
    }

    debug(message: string, data?: unknown, context?: string) {
        if (this.isDevelopment) {
            this.print(this.format('debug', message, data, context));
        }
    }
}

export const logger = new Logger();
