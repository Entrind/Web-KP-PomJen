import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill";
import AvailabilityCard from "../components/AvailabilityCard";


// Jarak sensor -> dasar (H) dalam cm
const sites = [
  { id: "ESP32", name: "ESP32", river_name: "Baskom Mandi", mount_height_cm: 80 },
];

const SHEET_ID = "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

function parseSheetCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

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
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );

      if (Number.isNaN(ts.getTime())) return null;

      return { ts, distance_cm };
    })
    .filter(Boolean);
}

function computeDataAvailability(records) {
  if (!records || records.length === 0) {
    return { percent: 0, daysWithData: 0, totalDays: 0 };
  }

  const daySet = new Set(
    records.map((r) => r.ts.toISOString().slice(0, 10))
  );

  const sorted = [...records].sort((a, b) => a.ts - b.ts);

  const firstDay = new Date(sorted[0].ts);
  const start = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
  const end = new Date();

  const totalDays =
    Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const daysWithData = daySet.size;
  const percent =
    totalDays > 0 ? (daysWithData / totalDays) * 100 : 0;

  return {
    percent: Math.min(percent, 100),
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

export default function Overview() {
  const [lastReading, setLastReading] = useState(null);
  const [availability, setAvailability] = useState(null);
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
        const parsed = parseSheetCsv(text).sort(
          (a, b) => a.ts - b.ts
        );

        if (!cancelled) {
          setLastReading(parsed.at(-1) || null);
          setAvailability(computeDataAvailability(parsed));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal mengambil data dari Google Sheets");
        }
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
  }, []);

  const site = sites[0];

  let waterLevelCm = null;
  let statusLevel = "normal";
  let lastTimeLabel = "";

  if (lastReading) {
    waterLevelCm = Math.max(
      site.mount_height_cm - lastReading.distance_cm,
      0
    );
    statusLevel = getStatusLevel(
      waterLevelCm,
      site.mount_height_cm
    );
    lastTimeLabel = lastReading.ts.toLocaleString("id-ID");
  }

  return (
    <div className="grid gap-6">
      <section className="grid md:grid-cols-2 gap-4">
        {/* INFO CARD */}
        <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          {/* ===== TOP ===== */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">{site.name}</h3>
              {!loading && !error && waterLevelCm !== null && (
                <StatusPill level={statusLevel} />
              )}
              <div className="ml-auto text-xs text-slate-500">
                ID: {site.id}
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Lokasi: {site.river_name}
            </div>

            <div className="text-sm text-slate-700">
              {loading && "Memuat data..."}
              {!loading && !error && waterLevelCm !== null && (
                <>Tinggi Air: <b>{waterLevelCm.toFixed(1)} cm</b></>
              )}
            </div>
          </div>

          {/* ===== BOTTOM ===== */}
          <Link
            to={`/sites/${site.id}`}
            className="text-blue-700 hover:underline text-sm w-fit mt-4"
          >
            Detail
          </Link>
        </div>

        {/* GAUGE CARD */}
        <div className="bg-white border rounded-xl p-4 shadow-sm h-full flex flex-col">
          <h4 className="text-sm font-medium text-slate-600 mb-2">
            Ketersediaan Data
          </h4>

          {availability && (
            <AvailabilityCard
              daysWithData={availability.daysWithData}
              totalDays={availability.totalDays}
            />
          )}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-2">Summary</h4>

        {!loading && !error && waterLevelCm !== null && (
          <div className="text-sm text-slate-700">
            Tinggi Air <b>{waterLevelCm.toFixed(1)} cm</b> • Terakhir
            diperbarui {lastTimeLabel}
          </div>
        )}
      </section>
    </div>
  );
}
