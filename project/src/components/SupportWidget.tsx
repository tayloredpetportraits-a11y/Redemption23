"use client";

import { useState } from "react";
import { MessageCircle, X, HelpCircle, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ChatInterface from "./ChatInterface";
import ContactForm from "./ContactForm";

export default function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"chat" | "contact">("chat");

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-20 right-4 md:bottom-24 md:right-8 z-50 w-[90vw] md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-black text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="font-semibold">Support Concierge</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100 m-2 rounded-lg">
                            <button
                                onClick={() => setActiveTab("chat")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === "chat"
                                        ? "bg-white text-black shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <MessageCircle size={16} />
                                Live Chat
                            </button>
                            <button
                                onClick={() => setActiveTab("contact")}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === "contact"
                                        ? "bg-white text-black shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <Mail size={16} />
                                Contact Us
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-white min-h-[300px]">
                            {activeTab === "chat" ? <ChatInterface /> : <ContactForm />}
                        </div>

                        <div className="bg-gray-50 p-2 text-center text-xs text-gray-400 border-t">
                            Powered by Pet Portrait AI
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X size={28} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <HelpCircle size={28} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tooltip hint */}
                {!isOpen && (
                    <span className="absolute right-full mr-3 bg-white text-black text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Need help?
                    </span>
                )}
            </button>
        </>
    );
}
