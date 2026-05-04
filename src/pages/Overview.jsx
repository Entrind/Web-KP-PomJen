import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill";
import AvailabilityCard from "../components/AvailabilityCard";
import { loadSites, getSheetUrl } from "../config/sites";

// ================= HELPERS =================
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

      const [datePart, timePart] = (datetimeStr || "").split(" ");
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
        distance_cm,
        water_level_cm: Math.max(mountHeight - distance_cm, 0),
      };
    })
    .filter(Boolean);
}

function computeDataAvailability(records) {
  if (!records?.length) return { percent: 0, daysWithData: 0, totalDays: 0 };

  const daySet = new Set(records.map((r) => r.ts.toISOString().slice(0, 10)));
  const sorted = [...records].sort((a, b) => a.ts - b.ts);
  const start   = new Date(sorted[0].ts);
  start.setHours(0, 0, 0, 0);
  const end     = new Date();
  const totalDays   = Math.floor((end - start) / 86_400_000) + 1;
  const daysWithData = daySet.size;

  return {
    percent: Math.min((daysWithData / totalDays) * 100, 100),
    daysWithData,
    totalDays,
  };
}

function getStatusLevel(waterLevel, mountHeight) {
  const ratio = (waterLevel / mountHeight) * 100;
  if (ratio < 60) return "normal";
  if (ratio < 85) return "waspada";
  return "siaga";
}

// ================= COMPONENT =================
export default function Overview() {
  const sites = loadSites();

  // { [site.id]: { waterLevelCm, statusLevel, lastTimeLabel, availability, error } }
  const [siteData, setSiteData] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);

      const results = await Promise.allSettled(
        sites.map(async (site) => {
          const res = await fetch(getSheetUrl(site));
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const text   = await res.text();
          const parsed = parseSheetCsv(text, site.mount_height_cm)
            .sort((a, b) => a.ts - b.ts);

          const last = parsed.at(-1);
          if (!last) throw new Error("Tidak ada data");

          const waterLevelCm = last.water_level_cm;

          return {
            id: site.id,
            waterLevelCm,
            statusLevel:   getStatusLevel(waterLevelCm, site.mount_height_cm),
            lastTimeLabel: last.ts.toLocaleString("id-ID"),
            availability:  computeDataAvailability(parsed),
            error: null,
          };
        })
      );

      if (!cancelled) {
        const map = {};
        results.forEach((result, idx) => {
          const id = sites[idx].id;
          if (result.status === "fulfilled") {
            map[id] = result.value;
          } else {
            map[id] = { error: result.reason?.message || "Gagal memuat" };
          }
        });
        setSiteData(map);
        setLoading(false);
      }
    }

    loadAll();
    const interval = setInterval(loadAll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6">
      {loading && (
        <div className="bg-white border rounded-xl p-4 text-sm text-slate-500">
          Memuat data semua pos...
        </div>
      )}

      {!loading &&
        sites.map((site) => {
          const d = siteData[site.id];

          return (
            <section key={site.id} className="grid md:grid-cols-2 gap-4">
              {/* INFO CARD */}
              <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{site.name}</h3>
                    {d && !d.error && (
                      <StatusPill level={d.statusLevel} />
                    )}
                    <div className="ml-auto text-xs text-slate-500">
                      ID: {site.id}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Lokasi: {site.river_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Tinggi Dudukan: {site.mount_height_cm} cm
                  </div>

                  <div className="text-sm text-slate-700">
                    {d?.error ? (
                      <span className="text-red-500">{d.error}</span>
                    ) : d ? (
                      <>Tinggi Air: <b>{d.waterLevelCm.toFixed(1)} cm</b></>
                    ) : null}
                  </div>

                  {d && !d.error && (
                    <div className="text-xs text-slate-400">
                      Update: {d.lastTimeLabel}
                    </div>
                  )}
                </div>

                <Link
                  to={`/sites/${site.id}`}
                  className="text-blue-700 hover:underline text-sm w-fit mt-4"
                >
                  Detail →
                </Link>
              </div>

              {/* AVAILABILITY CARD */}
              <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col">
                <h4 className="text-sm font-medium text-slate-600 mb-2">
                  Ketersediaan Data
                </h4>
                {d?.availability && (
                  <AvailabilityCard
                    daysWithData={d.availability.daysWithData}
                    totalDays={d.availability.totalDays}
                  />
                )}
              </div>
            </section>
          );
        })}
    </div>
  );
}