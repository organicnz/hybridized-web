export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        {/* Main Content Skeleton */}
        <div className="w-full lg:w-[65%] space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <div className="h-10 bg-white/5 rounded w-48 animate-pulse" />
            <div className="h-5 bg-white/5 rounded w-32 animate-pulse" />
          </div>

          {/* Players Skeleton */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#181818] rounded-lg overflow-hidden border border-white/5 p-4"
            >
              <div className="h-6 bg-white/5 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-full mb-1 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-2/3 mb-3 animate-pulse" />
              <div className="h-3 bg-white/5 rounded w-32 mb-3 animate-pulse" />
              <div className="h-[166px] bg-black/20 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Sidebar Skeleton */}
        <aside className="w-full lg:w-[35%]">
          <div className="bg-[#181818] rounded-lg overflow-hidden border border-white/5">
            <div className="h-56 bg-white/5 animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-8 bg-white/5 rounded w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded animate-pulse" />
                <div className="h-4 bg-white/5 rounded animate-pulse" />
                <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
