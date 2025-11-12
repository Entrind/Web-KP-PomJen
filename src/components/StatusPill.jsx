export default function StatusPill({ level = "normal" }) {
  const map = {
    normal: "bg-emerald-100 text-emerald-700",
    waspada: "bg-amber-100 text-amber-700",
    siaga: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[level] || map.normal}`}>
      {level}
    </span>
  );
}
