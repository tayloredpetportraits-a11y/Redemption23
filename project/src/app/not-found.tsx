import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-12 rounded-lg text-center space-y-6 max-w-md">
        <div className="text-7xl">404</div>
        <div className="space-y-2">
          <h1 className="text-3xl">Order Not Found</h1>
          <p className="text-zinc-400">
            The order you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <Link href="/" className="btn-primary rounded-lg inline-block">
          Go Home
        </Link>
      </div>
    </div>
  );
}
