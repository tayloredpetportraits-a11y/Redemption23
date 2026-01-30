import Link from 'next/link';
// MagicImporter removed

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-stone-900 font-serif text-5xl md:text-6xl tracking-tight">Taylored Pet Portraits</h1>
          <p className="text-stone-600 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Redeem your beautiful pet portrait artwork
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/customer"
            className="btn-primary inline-flex items-center justify-center text-lg min-h-[56px] min-w-[200px] shadow-lg shadow-emerald-900/10"
          >
            Customer Portal
          </Link>
          <Link
            href="/admin/login"
            className="btn-secondary inline-flex items-center justify-center text-lg min-h-[56px] min-w-[200px]"
          >
            Admin Portal
          </Link>
        </div>



      </div>
    </main>
  );
}

