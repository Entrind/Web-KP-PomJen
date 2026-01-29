import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

// CONFIG 
const MOUNT_HEIGHT_CM = 80;
const SHEET_ID = "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// HELPERS
function computeWaterLevel(distance_cm) {
  return Math.max(MOUNT_HEIGHT_CM - distance_cm, 0);
}

function getLocalDateKey(ts) {
  const y = ts.getFullYear();
  const m = String(ts.getMonth() + 1).padStart(2, "0");
  const d = String(ts.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseSheetCsv(text) {
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
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );

      if (Number.isNaN(ts.getTime())) return null;

      return {
        ts,
        water_level_cm: computeWaterLevel(distance_cm),
      };
    })
    .filter(Boolean);
}

// ================= COMPONENT =================
export default function Riwayat() {
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(SHEET_CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const parsed = parseSheetCsv(text);

        parsed.sort((a, b) => a.ts - b.ts);

        const byDate = new Map();

        parsed.forEach((r) => {
          const dateKey = getLocalDateKey(r.ts);
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
              sumWater: water,
              count: 1,
              avgWater: water,
            });
          } else {
            existing.minWater = Math.min(existing.minWater, water);
            existing.maxWater = Math.max(existing.maxWater, water);
            existing.sumWater += water;
            existing.count += 1;
            existing.avgWater = existing.sumWater / existing.count;
          }
        });

        setDailyStats(
          Array.from(byDate.values()).sort((a, b) =>
            a.dateKey.localeCompare(b.dateKey)
          )
        );
      } catch (err) {
        setError(err.message || "Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="grid gap-6">
      <h3 className="font-semibold text-slate-50 text-lg">
        Riwayat Tinggi Air Harian
      </h3>

      {/*  GRAPH  */}
      {!loading && !error && dailyStats.length > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis unit=" cm" />
              <Tooltip
                formatter={(v) => [`${v.toFixed(1)} cm`, ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="minWater"
                name="Minimum"
                stroke="#2563eb"   // biru
                strokeWidth={2}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="avgWater"
                name="Rata-rata"
                stroke="#16a34a"   // hijau
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />

              <Line
                type="monotone"
                dataKey="maxWater"
                name="Maksimum"
                stroke="#dc2626"   // merah
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && dailyStats.length > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th>Tanggal</th>
                <th className="text-right">Minimum (cm)</th>
                <th className="text-right">Maksimum (cm)</th>
                <th className="text-right">Rata-rata (cm)</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((d) => (
                <tr key={d.dateKey} className="border-t">
                  <td className="py-1.5">{d.dateLabel}</td>
                  <td className="text-right">{d.minWater.toFixed(1)}</td>
                  <td className="text-right">{d.maxWater.toFixed(1)}</td>
                  <td className="text-right">{d.avgWater.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="bg-white border rounded-xl p-4 text-sm">
          Memuat data...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
