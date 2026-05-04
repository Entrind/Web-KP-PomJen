import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { loadSites, getSheetUrl } from "../config/sites";

// ================= HELPERS =================
function getStatusByWater(waterLevel, mountHeight) {
  const ratio = (waterLevel / mountHeight) * 100;
  if (ratio < 60) return "normal";
  if (ratio < 85) return "waspada";
  return "siaga";
}

const statusLabelMap = {
  normal:  "Normal",
  waspada: "Waspada",
  siaga:   "Siaga",
};

function parseSheetCsv(text, mountHeight) {
  const lines = text.trim().split(/\r?\n/);

  return lines
    .map((line) => {
      const cols = line.split(",");
      if (cols.length < 3) return null;

      const datetimeStr = cols[0]?.trim();
      const distanceStr = cols[2]?.trim();

      const distance_cm = Number(distanceStr.replace(",", "."));
      if (Number.isNaN(distance_cm)) return null;

      const [datePart, timePart] = datetimeStr.split(" ");
      if (!datePart || !timePart) return null;

      const [day, month, year] = datePart.split("-");
      const [hour, minute, second] = timePart.split(":");

      const ts = new Date(
        Number(year), Number(month) - 1, Number(day),
        Number(hour), Number(minute), Number(second)
      );
      if (Number.isNaN(ts.getTime())) return null;

      const water_level_cm = Math.max(mountHeight - distance_cm, 0);

      return {
        ts,
        distance_cm,
        water_level_cm,
        timeLabel: ts.toLocaleTimeString("id-ID", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        dateTimeLabel: ts.toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
      };
    })
    .filter(Boolean);
}

// ================= COMPONENT =================
export default function DetailPos() {
  const { id }  = useParams();
  const site    = loadSites().find((s) => s.id === id);

  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!site) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(getSheetUrl(site));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text   = await res.text();
        const parsed = parseSheetCsv(text, site.mount_height_cm)
          .sort((a, b) => a.ts - b.ts);

        if (!cancelled) setRows(parsed.slice(-30));
      } catch (err) {
        if (!cancelled) setError(err.message || "Gagal mengambil data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  // Pos tidak ditemukan di config
  if (!site) {
    return (
      <div className="grid gap-4">
        <Link to="/" className="text-blue-200 hover:underline text-sm">
          ← Kembali
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Pos dengan ID "{id}" tidak ditemukan di konfigurasi.
        </div>
      </div>
    );
  }

  const mountHeight = site.mount_height_cm;

  // ===== CHART DATA =====
  const chartData = rows.map((r, idx) => {
    const currentStatus = getStatusByWater(r.water_level_cm, mountHeight);
    const prev          = rows[idx - 1];
    const prevStatus    = prev
      ? getStatusByWater(prev.water_level_cm, mountHeight)
      : currentStatus;

    const base = {
      timeLabel:     r.timeLabel,
      water_normal:  null,
      water_waspada: null,
      water_siaga:   null,
    };

    base[`water_${currentStatus}`] = r.water_level_cm;

    // Bridge point biar garis nyambung antar segmen
    if (prevStatus !== currentStatus && prev) {
      base[`water_${prevStatus}`] = r.water_level_cm;
    }

    return base;
  });

  const tableData = [...rows].reverse();

  return (
    <div className="grid gap-6">
      {/* HEADER */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link to="/" className="text-blue-200 hover:underline text-sm">
          ← Kembali
        </Link>
        <h3 className="font-semibold text-slate-50 text-lg">
          {site.name} — {site.river_name}
        </h3>
        <span className="ml-auto text-xs text-slate-400">
          Dudukan: {mountHeight} cm
        </span>
      </div>

      {loading && (
        <div className="bg-white border rounded-xl p-4 text-sm text-slate-500">
          Memuat data...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* CHART */}
          <div className="bg-white border rounded-xl p-4 shadow-sm h-[320px]">
            <h4 className="font-semibold text-slate-800 mb-2 text-sm">
              Tinggi Air (cm)
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" />
                <YAxis domain={[0, mountHeight]} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)} cm`, "Tinggi Air"]}
                  labelFormatter={(l) => `Waktu: ${l}`}
                />
                <ReferenceLine
                  y={mountHeight * 0.6}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: "Waspada", position: "right", fontSize: 10, fill: "#f59e0b" }}
                />
                <ReferenceLine
                  y={mountHeight * 0.85}
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label={{ value: "Siaga", position: "right", fontSize: 10, fill: "#dc2626" }}
                />
                <Line dataKey="water_normal"  stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="water_waspada" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="water_siaga"   stroke="#dc2626" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TABLE */}
          <div className="bg-white border rounded-xl p-4 shadow-sm overflow-auto">
            <h4 className="font-semibold text-slate-800 mb-2 text-sm">
              Riwayat Tinggi Air
            </h4>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th>Tanggal & Waktu</th>
                  <th className="text-right">Tinggi Air (cm)</th>
                  <th className="text-right">Jarak Sensor (cm)</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((r, i) => {
                  const level = getStatusByWater(r.water_level_cm, mountHeight);
                  return (
                    <tr key={i} className="border-t">
                      <td className="py-1.5">{r.dateTimeLabel}</td>
                      <td className="text-right">{r.water_level_cm.toFixed(1)}</td>
                      <td className="text-right">{r.distance_cm.toFixed(1)}</td>
                      <td className="text-right">{statusLabelMap[level]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}