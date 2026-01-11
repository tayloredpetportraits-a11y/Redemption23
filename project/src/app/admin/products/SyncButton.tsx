
'use client';

import { useFormStatus } from 'react-dom';
import { syncPrintifyProducts } from '@/app/actions/sync-products';
import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

export function SyncButton() {
    const [message, setMessage] = useState<string | null>(null);

    async function handleSync(formData: FormData) {
        setMessage(null);
        const result = await syncPrintifyProducts();
        if (result.success) {
            setMessage(`Success! Synced ${result.successful} products.`);
            // Refresh the page data
            window.location.reload();
        } else {
            setMessage(`Error: ${result.error}`);
        }
    }

    return (
        <div className="flex items-center gap-4">
            {message && (
                <span className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                    {message}
                </span>
            )}
            <form action={handleSync}>
                <SubmitButton />
            </form>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {pending ? 'Syncing...' : 'Sync with Printify'}
        </button>
    );
}
