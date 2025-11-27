export default function StatusPill({ level = "normal" }) {
  const map = {
    normal: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    waspada: "bg-amber-100 text-amber-700 border border-amber-300",
    siaga: "bg-red-100 text-red-700 border border-red-300",
  };
  const label = {
    normal: "Normal",
    waspada: "Waspada",
    siaga: "Siaga",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${map[level] || map.normal}`}
    >
      {label[level] || "Normal"}
    </span>
  );
}
