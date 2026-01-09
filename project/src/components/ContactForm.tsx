"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export default function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
        };

        try {
            const res = await fetch("/api/support/email", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to send message");

            setSuccess(true);
            e.currentTarget.reset();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Message Sent!</h3>
                <p className="text-green-600 mt-2">
                    We&apos;ll get back to you as soon as possible.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 text-sm text-green-700 underline hover:text-green-800"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                </label>
                <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                    placeholder="Your name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                    placeholder="email@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                </label>
                <select
                    name="subject"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm bg-white"
                >
                    <option value="General Question">General Question</option>
                    <option value="Order Status">Order Status</option>
                    <option value="Issue with Upload">Issue with Upload</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                </label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm resize-none"
                    placeholder="How can we help?"
                />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                ) : (
                    "Send Message"
                )}
            </button>
        </form>
    );
}
