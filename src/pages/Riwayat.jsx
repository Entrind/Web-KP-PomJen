import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { loadSites, getSheetUrl } from "../config/sites";

// ================= HELPERS =================
function getLocalDateKey(ts) {
  const y = ts.getFullYear();
  const m = String(ts.getMonth() + 1).padStart(2, "0");
  const d = String(ts.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

      return {
        ts,
        water_level_cm: Math.max(mountHeight - distance_cm, 0),
      };
    })
    .filter(Boolean);
}

// ================= COMPONENT =================
export default function Riwayat() {
  const { id }      = useParams();   // optional — kalau ada, filter ke 1 pos
  const allSites    = loadSites();
  const activeSites = id ? allSites.filter((s) => s.id === id) : allSites;

  // { [site.id]: DailyStat[] }
  const [allStats, setAllStats]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled(
          activeSites.map(async (site) => {
            const res = await fetch(getSheetUrl(site));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const text   = await res.text();
            const parsed = parseSheetCsv(text, site.mount_height_cm)
              .sort((a, b) => a.ts - b.ts);

            const byDate = new Map();
            parsed.forEach((r) => {
              const key   = getLocalDateKey(r.ts);
              const label = r.ts.toLocaleDateString("id-ID", {
                day: "2-digit", month: "2-digit", year: "numeric",
              });
              const w = r.water_level_cm;

              if (!byDate.has(key)) {
                byDate.set(key, {
                  dateKey: key, dateLabel: label,
                  minWater: w, maxWater: w, sumWater: w, count: 1, avgWater: w,
                });
              } else {
                const e = byDate.get(key);
                e.minWater  = Math.min(e.minWater, w);
                e.maxWater  = Math.max(e.maxWater, w);
                e.sumWater += w;
                e.count    += 1;
                e.avgWater  = e.sumWater / e.count;
              }
            });

            return {
              id: site.id,
              stats: Array.from(byDate.values()).sort((a, b) =>
                a.dateKey.localeCompare(b.dateKey)
              ),
            };
          })
        );

        const map = {};
        results.forEach((r, idx) => {
          const siteId = activeSites[idx].id;
          map[siteId] = r.status === "fulfilled" ? r.value.stats : [];
        });
        setAllStats(map);
      } catch (err) {
        setError(err.message || "Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-3">
        {id && (
          <Link to="/riwayat" className="text-blue-200 hover:underline text-sm">
            ← Semua Pos
          </Link>
        )}
        <h3 className="font-semibold text-slate-50 text-lg">
          Riwayat Tinggi Air Harian
          {id && ` — ${allSites.find((s) => s.id === id)?.name ?? id}`}
        </h3>
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

      {!loading && !error &&
        activeSites.map((site) => {
          const dailyStats = allStats[site.id] ?? [];

          return (
            <div key={site.id} className="grid gap-4">
              <h4 className="font-semibold text-slate-400 font-medium">
                {site.name} — {site.river_name}
              </h4>

              {dailyStats.length === 0 ? (
                <div className="bg-white border rounded-xl p-4 text-sm text-slate-500">
                  Tidak ada data untuk pos ini.
                </div>
              ) : (
                <>
                  {/* CHART */}
                  <div className="bg-white border rounded-xl p-4 shadow-sm h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateLabel" />
                        <YAxis unit=" cm" />
                        <Tooltip formatter={(v) => [`${v.toFixed(1)} cm`, ""]} />
                        <Legend />
                        <Line type="monotone" dataKey="minWater" name="Minimum"   stroke="#2563eb" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="avgWater" name="Rata-rata" stroke="#16a34a" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="maxWater" name="Maksimum"  stroke="#dc2626" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* TABLE */}
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
                        {[...dailyStats].reverse().map((d) => (
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
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}