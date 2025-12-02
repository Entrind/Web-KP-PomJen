import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Jarak sensor -> dasar (H) dalam cm
// Ubah sesuai jarak riil pemasangan sensor
const MOUNT_HEIGHT_CM = 220;

// ID Google Sheet dan URL CSV export
const SHEET_ID = "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Hitung status berdasarkan tinggi air (sama seperti di Overview.jsx)
function getStatusLevel(waterLevel, mountHeight) {
  const ratio = (waterLevel / mountHeight) * 100;
  if (ratio < 60) return "normal";
  if (ratio < 85) return "waspada";
  return "siaga";
}

const statusLabelMap = {
  normal: "Normal",
  waspada: "Waspada",
  siaga: "Siaga",
};

// Parse CSV dari Google Sheets
// Format kolom yang dipakai: A=Datetime, B=Epoch, C=Distance_cm
// (kolom D diabaikan / boleh dihapus dari sheets)
function parseSheetCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  return lines
    .map((line) => {
      const cols = line.split(",");
      if (cols.length < 3) return null;

      const datetimeStr = cols[0]?.trim();   // "01-12-2025 15:53:42"
      const epochStr = cols[1]?.trim();      // "1764604422"
      const distanceStr = cols[2]?.trim();   // "217.4"

      const epochSec = Number(epochStr);
      const distance_cm = Number(distanceStr.replace(",", "."));
      if (Number.isNaN(distance_cm)) return null;

      // Tentukan timestamp dari epoch kalau valid, kalau tidak pakai string datetime
      let ts;
      if (!Number.isNaN(epochSec) && epochSec > 0) {
        ts = new Date(epochSec * 1000);
      } else {
        // parse "dd-mm-yyyy HH:MM:SS"
        const [datePart, timePart] = (datetimeStr || "").split(" ");
        if (!datePart || !timePart) return null;
        const [day, month, year] = datePart.split("-");
        ts = new Date(`${year}-${month}-${day}T${timePart}`);
      }
      if (Number.isNaN(ts.getTime())) return null;

      const water_level_cm = Math.max(MOUNT_HEIGHT_CM - distance_cm, 0);

      return {
        ts,
        distance_cm,
        water_level_cm,
        timeLabel: ts.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        dateTimeLabel: ts.toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
    })
    .filter(Boolean);
}

export default function DetailPos() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(SHEET_CSV_URL);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        const parsed = parseSheetCsv(text);
        if (!cancelled) {
          setRows(parsed);
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

    // auto-refresh tiap 1 menit
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Data untuk grafik
  const chartData = rows.map((r) => ({
    timeLabel: r.timeLabel,
    water_level_cm: r.water_level_cm,
  }));

  // Tabel: terbaru di atas
  const tableData = [...rows].reverse();

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-blue-700 hover:underline text-sm">
          ← Kembali
        </Link>
        <h3 className="font-semibold text-slate-800 text-lg">
          Detail Pos: {id}
        </h3>
      </div>

      {loading && (
        <div className="bg-white border rounded-xl p-4 shadow-sm text-sm text-slate-600">
          Memuat data dari Google Sheets...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Gagal memuat data: {error}.<br />
          Pastikan Google Sheet diset{" "}
          <b>&quot;Anyone with the link – Viewer&quot;</b>.
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm text-sm text-slate-600">
          Belum ada data pada Google Sheets.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* Grafik tinggi air */}
          <div className="bg-white border rounded-xl p-4 shadow-sm h-[320px]">
            <h4 className="font-semibold text-slate-800 mb-2 text-sm">
              Tinggi Air (cm) dari Google Sheets
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) =>
                    name === "water_level_cm"
                      ? [`${value} cm`, "Tinggi Air"]
                      : [value, name]
                  }
                  labelFormatter={(label) => `Waktu: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="water_level_cm"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabel riwayat */}
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
                {tableData.map((r, idx) => {
                  const level = getStatusLevel(
                    r.water_level_cm,
                    MOUNT_HEIGHT_CM
                  );
                  const label = statusLabelMap[level] || level;

                  return (
                    <tr key={idx} className="border-t">
                      <td className="py-1.5">{r.dateTimeLabel}</td>
                      <td className="text-right">
                        {r.water_level_cm.toFixed(1)}
                      </td>
                      <td className="text-right">
                        {r.distance_cm.toFixed(1)}
                      </td>
                      <td className="text-right">{label}</td>
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
