export default function AdminLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-64 bg-black/5 rounded-lg mb-2"></div>
          <div className="h-4 w-48 bg-black/5 rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-black/5 rounded-xl"></div>
      </div>

      {/* Global stats skeleton */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl p-5 border border-black/5 bg-white shadow-sm flex flex-col justify-between h-32">
            <div className="h-6 w-6 bg-black/5 rounded-full mb-2"></div>
            <div className="h-8 w-16 bg-black/5 rounded-lg mt-auto"></div>
            <div className="h-4 w-24 bg-black/5 rounded-lg mt-2"></div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 mt-8">
        <div className="h-6 w-32 bg-black/5 rounded-lg"></div>
        <div className="h-10 w-64 bg-black/5 rounded-xl"></div>
      </div>

      {/* Institutes grid skeleton */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden h-48 flex flex-col">
            <div className="h-2 bg-black/5 w-full"></div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-black/5"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-black/5 rounded-lg mb-1"></div>
                  <div className="h-3 w-24 bg-black/5 rounded-lg"></div>
                </div>
                <div className="h-5 w-16 bg-black/5 rounded-full"></div>
              </div>
              <div className="h-4 w-full bg-black/5 rounded-lg mt-auto mb-4"></div>
              <div className="h-8 w-full bg-black/5 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
