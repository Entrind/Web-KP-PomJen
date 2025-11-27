import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill";

const sites = [
  { id: "ESP32", name: "ESP32", river_name: "Baskom Mandi", mount_height_cm: 100 } // mount_height_cm adalah jarak pemasangan sensor dari dasar sungai
] 

const lastReading = {
  site_id: "1",
  ts: "2025-11-12T09:00:00Z",
  distance_cm: 16,
  battery_v: 3.9,
  rssi: -65
};

function getStatusLevel(waterLevel, mountHeight) {
  const ratio = (waterLevel / mountHeight) * 100;

  if (ratio < 60) return "normal";
  if (ratio < 85) return "waspada";
  return "siaga";
}

export default function Overview() {
  return (
    <div className="grid gap-6">

      <section className="grid md:grid-cols-2 gap-4">
        {sites.map((s) => {
          const waterLevelCm = Math.max(
            s.mount_height_cm - lastReading.distance_cm,
            0
          );

          const status = getStatusLevel(waterLevelCm, s.mount_height_cm);

          return (
            <div key={s.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800">{s.name}</h3>
                <StatusPill level={status} />
                <div className="ml-auto text-xs text-slate-500">ID: {s.id}</div>
              </div>

              <div className="text-sm text-slate-600">
                Lokasi: {s.river_name}
              </div>
              <div className="mt-3 text-sm text-slate-600">
                Tinggi Air: <b>{waterLevelCm} cm</b>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Link
                  to={`/sites/${s.id}`}
                  className="text-blue-700 hover:underline text-sm"
                >
                  Detail
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-2">Ringkasan Terakhir</h4>

        {(() => {
          const waterLevelCm =
            sites[0].mount_height_cm - lastReading.distance_cm;

          return (
            <div className="text-sm text-slate-700">
              Tinggi Air <b>{waterLevelCm} cm</b> • Baterai {lastReading.battery_v} V •{" "}
              {new Date(lastReading.ts).toLocaleString()}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
