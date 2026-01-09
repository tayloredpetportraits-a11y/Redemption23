"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";

interface Message {
    role: "user" | "model";
    content: string;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", content: "Hi! I'm Barkley. How can I help you with your pet portrait today? 🐾" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch("/api/support/chat", {
                method: "POST",
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.slice(1), // sending history without the initial greeting if desired, or all
                }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            setMessages((prev) => [...prev, { role: "model", content: data.response }]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "model", content: "I'm having a little trouble connecting right now. Please try again or use the Contact form! 🐶" },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-gray-200" : "bg-brand-100 text-brand-600"
                                }`}
                        >
                            {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === "user"
                                    ? "bg-black text-white rounded-tr-sm"
                                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-tl-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2 bg-gray-50 border rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
