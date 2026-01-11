
'use client';

import { useState } from 'react';
import { addMockupTemplate } from '@/app/actions/add-template';
import { Plus } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function AddTemplateModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [msg, setMsg] = useState('');

    async function handleSubmit(formData: FormData) {
        const res = await addMockupTemplate(formData);
        if (res.success) {
            setMsg('Saved!');
            setIsOpen(false);
            window.location.reload();
        } else {
            setMsg('Error: ' + res.error);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black border border-zinc-200 px-3 py-1.5 rounded-md bg-white"
            >
                <Plus className="w-4 h-4" />
                Add Custom Template
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">Add Mockup Template</h3>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Template Name (e.g. 11x14 Canvas)</label>
                        <input name="name" required className="w-full border rounded p-2 text-sm" placeholder="My New Template" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Image URL (Blank Product)</label>
                        <input name="imageUrl" required className="w-full border rounded p-2 text-sm" placeholder="https://..." />
                        <p className="text-xs text-zinc-400 mt-1">Upload to Supabase Storage first and paste URL here</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs font-medium mb-1">Top (%)</label>
                            <input name="top" type="number" required className="w-full border rounded p-2 text-sm" placeholder="25" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Left (%)</label>
                            <input name="left" type="number" required className="w-full border rounded p-2 text-sm" placeholder="35" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Width (%)</label>
                            <input name="width" type="number" required className="w-full border rounded p-2 text-sm" placeholder="30" />
                        </div>
                    </div>

                    {msg && <p className="text-red-500 text-sm">{msg}</p>}

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <SubmitBtn />
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubmitBtn() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
        >
            {pending ? 'Saving...' : 'Save Template'}
        </button>
    );
}
