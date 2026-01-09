'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4">
            <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
            <p className="text-zinc-400 mb-8">{error.message || 'An unexpected error occurred'}</p>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-4 py-2 bg-amber-500 text-black rounded hover:bg-amber-600 transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
