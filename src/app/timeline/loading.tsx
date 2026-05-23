export default function TimelineLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-warm-white/50"
        />
      ))}
    </div>
  )
}
