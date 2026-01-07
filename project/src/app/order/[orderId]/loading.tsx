export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-zinc-400">Loading your order...</p>
      </div>
    </div>
  );
}
