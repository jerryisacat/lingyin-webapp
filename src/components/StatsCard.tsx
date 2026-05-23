interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export function StatsCard({ icon, label, value }: StatsCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-sakura/15 bg-white/60 p-5 shadow-soft transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sakura/10">
        <span className="text-sakura">{icon}</span>
      </div>
      <span className="text-2xl font-bold text-ink">{value}</span>
      <span className="text-xs text-ink-light">{label}</span>
    </div>
  );
}
