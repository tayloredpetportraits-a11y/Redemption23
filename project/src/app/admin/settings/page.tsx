'use client';

import { useState } from 'react';
import { simulateShopifyOrder } from '@/app/actions/test';
import { Beaker, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleRunTest = async () => {
        if (!confirm("Run E2E Simulation? This will create a real order and consume generate credits.")) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await simulateShopifyOrder();
            if (res.success) {
                setStatus('success');
                setMessage(`Test Order Created! ID: ${res.orderId}`);
            } else {
                setStatus('error');
                setMessage(`Failed: ${res.error}`);
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(`System Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Settings & Tools</h1>
            <p className="text-zinc-500 mb-8">System configuration and developer tools.</p>

            {/* Developer Tools Section */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        <Beaker className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">Developer Simulation</h3>
                        <p className="text-zinc-500 text-sm mt-1 mb-4">
                            Simulate an incoming Shopify Order to test the end-to-end flow.
                            Uses <code>public/test-dog.jpg</code> as the source.
                        </p>

                        <button
                            onClick={handleRunTest}
                            disabled={loading}
                            className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🧪'}
                            {loading ? 'Running Simulation...' : 'Run E2E Test (Shopify)'}
                        </button>

                        {/* Status Output */}
                        {status !== 'idle' && (
                            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 text-sm ${status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                <span className="font-mono">{message}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
