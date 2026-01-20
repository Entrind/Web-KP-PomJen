import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusPill from "../components/StatusPill";

// Jarak sensor -> dasar (H) dalam cm
const sites = [
  { id: "ESP32", name: "ESP32", river_name: "Baskom Mandi", mount_height_cm: 80 }
];

const SHEET_ID = "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// ✅ PARSE SEBAGAI WAKTU LOKAL, ABAIKAN EPOCH
function parseSheetCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  return lines
    .map((line) => {
      const cols = line.split(",");
      if (cols.length < 3) return null;

      const datetimeStr = cols[0]?.trim();   // "01-12-2025 15:53:42"
      const distanceStr = cols[2]?.trim();   // "217.4"

      const distance_cm = Number(distanceStr.replace(",", "."));
      if (Number.isNaN(distance_cm)) return null;

      // parse "dd-mm-yyyy HH:MM:SS" sebagai waktu lokal
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

      return {
        ts,
        distance_cm,
      };
    })
    .filter(Boolean);
}

function getStatusLevel(waterLevel, mountHeight) {
  const ratio = (waterLevel / mountHeight) * 100;
  if (ratio < 60) return "normal";
  if (ratio < 85) return "waspada";
  return "siaga";
}

export default function Overview() {
  const [lastReading, setLastReading] = useState(null);
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
        if (!cancelled) {
          const latest = parsed.length > 0 ? parsed[parsed.length - 1] : null;
          setLastReading(latest);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Gagal mengambil data dari Google Sheets");
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
    waterLevelCm = Math.max(site.mount_height_cm - lastReading.distance_cm, 0);
    statusLevel = getStatusLevel(waterLevelCm, site.mount_height_cm);
    lastTimeLabel = lastReading.ts.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{site.name}</h3>
            {!loading && !error && waterLevelCm !== null && (
              <StatusPill level={statusLevel} />
            )}
            <div className="ml-auto text-xs text-slate-500">ID: {site.id}</div>
          </div>

          <div className="text-sm text-slate-600">
            Lokasi: {site.river_name}
          </div>

          <div className="mt-3 text-sm text-slate-600">
            {loading && "Memuat data dari Google Sheets..."}
            {error && !loading && (
              <span className="text-red-600">
                Gagal memuat data: {error}
              </span>
            )}
            {!loading && !error && waterLevelCm !== null && (
              <>
                Tinggi Air: <b>{waterLevelCm.toFixed(1)} cm</b>
              </>
            )}
            {!loading && !error && waterLevelCm === null && (
              <>Belum ada data dari Google Sheets.</>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Link
              to={`/sites/${site.id}`}
              className="text-blue-700 hover:underline text-sm"
            >
              Detail
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-2">Ringkasan Terakhir</h4>

        {loading && (
          <div className="text-sm text-slate-700">
            Memuat data dari Google Sheets...
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-red-700">
            Gagal memuat data: {error}
          </div>
        )}

        {!loading && !error && waterLevelCm !== null && (
          <div className="text-sm text-slate-700">
            Tinggi Air <b>{waterLevelCm.toFixed(1)} cm</b> • Terakhir diperbarui{" "}
            {lastTimeLabel}
          </div>
        )}

        {!loading && !error && waterLevelCm === null && (
          <div className="text-sm text-slate-700">
            Belum ada data dari Google Sheets.
          </div>
        )}
      </section>
    </div>
  );
}
