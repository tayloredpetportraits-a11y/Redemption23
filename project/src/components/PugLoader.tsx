
import Image from 'next/image';

export default function PugLoader({ text = "Generating Magic..." }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
            <div className="relative w-32 h-32 md:w-48 md:h-48 mb-6 rounded-full overflow-hidden border-4 border-brand-blue/20 shadow-2xl shadow-brand-blue/10 animate-pulse">
                <Image
                    src="/logo.gif"
                    alt="Loading..."
                    fill
                    className="object-cover"
                    unoptimized // Needed for GIFs usually in Next.js if purely local
                />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide animate-pulse">
                {text}
            </h2>
            <p className="text-zinc-400 text-sm mt-2">Hang tight, we&apos;re tailoring the pixels.</p>
        </div>
    );
}
