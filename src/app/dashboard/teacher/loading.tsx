export default function TeacherLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 bg-[var(--ag-surface-alt)] rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-[var(--ag-surface-alt)] rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-[var(--ag-surface-alt)] rounded-xl"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl p-5 border border-[var(--ag-border-light)] bg-[var(--ag-surface)] shadow-sm flex flex-col justify-center h-32">
            <div className="h-8 w-16 bg-[var(--ag-surface-alt)] rounded-lg mb-2"></div>
            <div className="h-4 w-32 bg-[var(--ag-surface-alt)] rounded-lg"></div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 mt-6">
        <div className="h-6 w-32 bg-[var(--ag-surface-alt)] rounded-lg"></div>
        <div className="h-10 w-64 bg-[var(--ag-surface-alt)] rounded-xl"></div>
      </div>

      {/* Courses grid skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] p-5 flex items-center gap-4 shadow-sm h-24">
            <div className="w-12 h-12 rounded-xl bg-[var(--ag-surface-alt)] flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-48 bg-[var(--ag-surface-alt)] rounded-lg"></div>
                <div className="h-4 w-16 bg-[var(--ag-surface-alt)] rounded-full"></div>
              </div>
              <div className="h-3 w-64 bg-[var(--ag-surface-alt)] rounded-lg"></div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <div className="h-6 w-8 bg-[var(--ag-surface-alt)] rounded-lg mb-1"></div>
              <div className="h-3 w-12 bg-[var(--ag-surface-alt)] rounded-lg"></div>
            </div>
            <div className="flex gap-2 pl-4 border-l border-[var(--ag-border-light)]">
              <div className="h-8 w-20 bg-[var(--ag-surface-alt)] rounded-lg"></div>
              <div className="h-8 w-20 bg-[var(--ag-surface-alt)] rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
