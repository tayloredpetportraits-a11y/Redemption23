
'use client';

import { useState } from 'react';
import { updateBlueprintMapping } from '@/app/actions/update-mapping';
import { Loader2 } from 'lucide-react';

interface MockupSelectProps {
    blueprintId: number;
    initialConfig: string | null;
    options: { value: string; label: string }[];
}

export function MockupSelect({ blueprintId, initialConfig, options }: MockupSelectProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [value, setValue] = useState(initialConfig || '');

    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newValue = e.target.value;
        setValue(newValue);
        setStatus('saving');

        // Allow saving empty value (to unset mapping)
        // if (!newValue) return;

        const result = await updateBlueprintMapping(blueprintId, newValue);
        if (result.success) {
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);
        } else {
            console.error(result.error);
            setStatus('error');
        }
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={value}
                onChange={handleChange}
                disabled={status === 'saving'}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
                <option value="">⚡️ Auto (Native Printify 3D)</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
            {status === 'saved' && <span className="text-green-500 text-xs">Saved</span>}
            {status === 'error' && <span className="text-red-500 text-xs">Error</span>}
        </div>
    );
}
