import { useEffect, useState } from "react";

// Jarak sensor -> dasar (H) dalam 
// Ubah sesuai jarak riil pemasangan sensor
const MOUNT_HEIGHT_CM = 220;

const SHEET_ID = "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Hitung tinggi air dari jarak sensor
function computeWaterLevel(distance_cm) {
  return Math.max(MOUNT_HEIGHT_CM - distance_cm, 0);
}

function parseSheetCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  return lines
    .map((line) => {
      const cols = line.split(",");
      if (cols.length < 3) return null;

      const datetimeStr = cols[0]?.trim();
      const epochStr = cols[1]?.trim();
      const distanceStr = cols[2]?.trim();

      const epochSec = Number(epochStr);
      const distance_cm = Number(distanceStr.replace(",", "."));
      if (Number.isNaN(distance_cm)) return null;

      let ts;
      if (!Number.isNaN(epochSec) && epochSec > 0) {
        ts = new Date(epochSec * 1000);
      } else {
        const [datePart, timePart] = (datetimeStr || "").split(" ");
        if (!datePart || !timePart) return null;
        const [day, month, year] = datePart.split("-");
        ts = new Date(`${year}-${month}-${day}T${timePart}`);
      }
      if (Number.isNaN(ts.getTime())) return null;

      const water_level_cm = computeWaterLevel(distance_cm);

      return { ts, distance_cm, water_level_cm };
    })
    .filter(Boolean);
}

export default function Riwayat() {
  const [rows, setRows] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(SHEET_CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const parsed = parseSheetCsv(text);
        if (cancelled) return;

        setRows(parsed);

        const byDate = new Map();

        parsed.forEach((r) => {
          const dateKey = r.ts.toISOString().slice(0, 10); 
          const dateLabel = r.ts.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          const water = r.water_level_cm;
          const existing = byDate.get(dateKey);

          if (!existing) {
            byDate.set(dateKey, {
              dateKey,
              dateLabel,
              minWater: water,
              maxWater: water,
            });
          } else {
            existing.minWater = Math.min(existing.minWater, water);
            existing.maxWater = Math.max(existing.maxWater, water);
          }
        });

        const statsArray = Array.from(byDate.values()).sort((a, b) =>
          a.dateKey.localeCompare(b.dateKey)
        );

        setDailyStats(statsArray);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal mengambil data dari Google Sheets");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // optional: auto-refresh tiap 5 menit
    const interval = setInterval(load, 300_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid gap-4">
      <h3 className="font-semibold text-slate-800 text-lg">
        Riwayat Tinggi Air Harian
      </h3>

      {loading && (
        <div className="bg-white border rounded-xl p-4 shadow-sm text-sm text-slate-600">
          Memuat data dari Google Sheets...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Gagal memuat data: {error}. Pastikan Google Sheet diset{" "}
          <b>&quot;Anyone with the link – Viewer&quot;</b>.
        </div>
      )}

      {!loading && !error && dailyStats.length === 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm text-sm text-slate-600">
          Belum ada data yang bisa dirangkum.
        </div>
      )}

      {!loading && !error && dailyStats.length > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th>Tanggal</th>
                <th className="text-right">Tinggi Air Minimum (cm)</th>
                <th className="text-right">Tinggi Air Maksimum (cm)</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((d) => (
                <tr key={d.dateKey} className="border-t">
                  <td className="py-1.5">{d.dateLabel}</td>
                  <td className="text-right">{d.minWater.toFixed(1)}</td>
                  <td className="text-right">{d.maxWater.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
