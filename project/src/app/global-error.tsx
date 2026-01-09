'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4">
                    <h2 className="text-2xl font-bold mb-4">Critical System Error</h2>
                    <p className="text-zinc-400 mb-8">{error.message || 'Something went wrong globally'}</p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
