'use client';

import { motion } from 'framer-motion';
import { RefreshCw, MessageSquare } from 'lucide-react';

interface RevisionStatusProps {
    petName: string;
    notes: string;
}

export default function RevisionStatus({ petName, notes }: RevisionStatusProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-4 space-y-8 max-w-2xl mx-auto text-center"
        >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-10 h-10 text-amber-500" />
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-zinc-100">Revision in Progress</h2>
                <p className="text-zinc-400 text-lg">
                    We&apos;ve received your feedback for <span className="text-amber-400 font-semibold">{petName}</span>&apos;s portrait.
                    <br />The artist is working on your changes!
                </p>
            </div>

            <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-left space-y-3">
                <div className="flex items-center gap-2 text-zinc-500 text-sm uppercase tracking-wide font-medium">
                    <MessageSquare className="w-4 h-4" />
                    Your Request
                </div>
                <p className="text-zinc-300 italic">&quot;{notes}&quot;</p>
            </div>

            <div className="text-sm text-zinc-500">
                You&apos;ll receive an email notification when your new portraits are ready to view.
            </div>
        </motion.div>
    );
}
