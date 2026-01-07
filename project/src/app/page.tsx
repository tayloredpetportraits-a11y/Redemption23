import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-zinc-100">Taylored Pet Portraits</h1>
          <p className="text-zinc-400 text-lg">
            Redemption Portal
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/customer"
            className="btn-primary inline-block bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            Customer Portal
          </Link>
          <Link
            href="/admin/login"
            className="btn-secondary inline-block"
          >
            Admin Portal
          </Link>
        </div>

        <div className="mt-12 text-sm text-zinc-500">
          <p>Admin password: admin123</p>
        </div>
      </div>
    </div>
  );
}
