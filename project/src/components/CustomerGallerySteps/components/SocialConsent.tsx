import { motion } from 'framer-motion';

interface SocialConsentProps {
    petName: string;
    socialConsent: boolean;
    setSocialConsent: (consent: boolean) => void;
    instagramHandle: string;
    setInstagramHandle: (handle: string) => void;
}

export default function SocialConsent({
    petName,
    socialConsent,
    setSocialConsent,
    instagramHandle,
    setInstagramHandle
}: SocialConsentProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${socialConsent
                ? 'border-brand-purple bg-brand-purple/5 shadow-lg shadow-brand-purple/10'
                : 'border-zinc-200 bg-white hover:border-brand-purple/30'
                }`}
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-gradient-to-br from-brand-purple/20 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="p-5 space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-3 rounded-xl transition-colors ${socialConsent ? 'bg-brand-purple text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="social-consent" className="block text-lg font-bold text-brand-navy cursor-pointer hover:text-brand-purple transition-colors">
                            Make {petName} Famous? 🌟
                        </label>
                        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                            We&apos;d love to show off your masterpiece! Enable this to let us feature {petName} on our Instagram.
                        </p>
                    </div>
                    <div className="flex items-center h-6 pt-1">
                        <input
                            id="social-consent"
                            type="checkbox"
                            checked={socialConsent}
                            onChange={(e) => setSocialConsent(e.target.checked)}
                            className="h-6 w-6 rounded-md border-zinc-300 text-brand-purple focus:ring-brand-purple/50 transition-all cursor-pointer"
                        />
                    </div>
                </div>

                {/* Handle Input - Animated Reveal */}
                <div className={`grid transition-all duration-300 ease-in-out ${socialConsent ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="bg-white/50 rounded-xl p-4 border border-brand-purple/10">
                            <label htmlFor="instagram-handle" className="block text-sm font-bold text-brand-navy mb-2">
                                Your Instagram Handle
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">@</span>
                                <input
                                    id="instagram-handle"
                                    type="text"
                                    value={instagramHandle}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/^@/, '');
                                        setInstagramHandle(val);
                                    }}
                                    placeholder="your.username"
                                    className="w-full pl-8 pr-4 py-3 bg-white border border-zinc-200 rounded-lg text-brand-navy placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-transparent transition-all"
                                />
                            </div>
                            <p className="text-xs text-brand-purple/80 mt-2 font-medium flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                We&apos;ll tag you if we post!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
