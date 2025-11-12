import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill";

const sites = [
  { id: "POS-AB01", name: "Pos AB01", river_name: "Sungai Pammana", mount_height_cm: 300 },
  { id: "POS-CD02", name: "Pos CD02", river_name: "Sungai Jeneberang", mount_height_cm: 280 },
];

const lastReading = {
  site_id: "POS-AB01",
  ts: "2025-11-12T09:00:00Z",
  water_level_cm: 176.6,
  battery_v: 3.9,
  rssi: -65
};

export default function Overview() {
  return (
    <div className="grid gap-6">
      <section className="grid md:grid-cols-2 gap-4">
        {sites.map((s) => (
          <div key={s.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">{s.name}</h3>
              <StatusPill level={s.id === "POS-AB01" ? "normal" : "waspada"} />
              <div className="ml-auto text-xs text-slate-500">{s.id}</div>
            </div>
            <div className="text-sm text-slate-600">Sungai: {s.river_name}</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Mount height: <b>{s.mount_height_cm} cm</b>
              </div>
              <Link to={`/sites/${s.id}`} className="text-blue-700 hover:underline text-sm">Detail</Link>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-2">Ringkasan Terakhir</h4>
        <div className="text-sm text-slate-700">
          Level air <b>{lastReading.water_level_cm} cm</b> • Baterai {lastReading.battery_v} V • {new Date(lastReading.ts).toLocaleString()}
        </div>
      </section>
    </div>
  );
}
