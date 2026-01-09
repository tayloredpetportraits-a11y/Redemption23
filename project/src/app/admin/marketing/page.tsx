/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect } from 'react';
import { getSocialPosts } from '@/lib/marketing/service';
import { format } from 'date-fns';
import { Share2, Copy, Check, X } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function MarketingPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, []);

    async function loadPosts() {
        setLoading(true);
        try {
            // Need to create a server action or API route to fetch this client side? 
            // Or just fetch in server component. Let's make this page client for now for interactivity, 
            // but we need a clear way to fetch. 
            // Since getSocialPosts is server-side (uses createAdminClient), we should theoretically fetch in a Server Component 
            // and pass to client, or use a Route Handler.
            // For simplicity in this "agentic" flow, let's assume we can't import server actions directly in client unless 'use server'.
            // I'll make an API route: /api/admin/marketing/posts

            const res = await fetch('/api/admin/marketing/posts');
            const data = await res.json();
            setPosts(data.posts || []);
        } catch (e) {
            console.error("Failed to load posts", e);
        } finally {
            setLoading(false);
        }
    }

    // Quick helpers
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied!");
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Social Media Marketing
                    </h1>
                    <p className="text-zinc-400 mt-2">Manage auto-generated posts for Instagram & Facebook.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-500">Loading drafts...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <motion.div
                            layout
                            key={post.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col"
                        >
                            {/* Image Preview */}
                            <div className="relative aspect-square">
                                {post.images?.url ? (
                                    <Image
                                        src={post.images.url}
                                        alt="Post Image"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs font-bold text-white capitalize backdrop-blur-md">
                                    {post.status}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col space-y-4">
                                <div>
                                    <h3 className="font-bold text-zinc-100">{post.orders?.pet_name}</h3>
                                    <p className="text-xs text-zinc-500">{format(new Date(post.created_at), 'MMM d, yyyy')}</p>
                                </div>

                                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-sm text-zinc-300 flex-1 relative group">
                                    <p className="whitespace-pre-wrap">{post.caption}</p>
                                    <p className="mt-2 text-blue-400">{post.hashtags?.join(' ')}</p>

                                    <button
                                        onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags?.join(' ')}`)}
                                        className="absolute top-2 right-2 p-1.5 bg-zinc-800 rounded hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Copy Caption"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        // onClick={() => copyToClipboard(post.images?.url)}
                                        onClick={() => window.open(post.images?.url, '_blank')}
                                        className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Share2 className="w-3 h-3" />
                                        Download Image
                                    </button>
                                    <button
                                        className="flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Check className="w-3 h-3" />
                                        Mark Posted
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {posts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                            <p>No marketing drafts found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
