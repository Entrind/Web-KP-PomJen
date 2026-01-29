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
  ReferenceLine,
} from "recharts";

// ================= CONFIG =================
const MOUNT_HEIGHT_CM = 80;

const SHEET_ID = "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// ================= HELPERS =================
function getStatusByWater(waterLevel) {
  const ratio = (waterLevel / MOUNT_HEIGHT_CM) * 100;
  if (ratio < 60) return "normal";
  if (ratio < 85) return "waspada";
  return "siaga";
}

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

// ================= COMPONENT =================
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const parsed = parseSheetCsv(text).sort((a, b) => a.ts - b.ts);

        if (!cancelled) {
          setRows(parsed.slice(-30));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal mengambil data");
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

  // ===== SEGMENTED + CONTINUOUS DATA =====
  const chartData = rows.map((r, idx) => {
    const currentStatus = getStatusByWater(r.water_level_cm);
    const prev = rows[idx - 1];
    const prevStatus = prev
      ? getStatusByWater(prev.water_level_cm)
      : currentStatus;

    const base = {
      timeLabel: r.timeLabel,
      water_normal: null,
      water_waspada: null,
      water_siaga: null,
    };

    // always set current segment
    base[`water_${currentStatus}`] = r.water_level_cm;

    // 👇 BRIDGE POINT (biar garis nyambung)
    if (prevStatus !== currentStatus && prev) {
      base[`water_${prevStatus}`] = r.water_level_cm;
    }

    return base;
  });

  const tableData = [...rows].reverse();

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-blue-200 hover:underline text-sm">
          ← Kembali
        </Link>
        <h3 className="font-semibold text-slate-50 text-lg">
          Detail Pos: {id}
        </h3>
      </div>

      {!loading && !error && rows.length > 0 && (
        <>
          {/* ===== CHART ===== */}
          <div className="bg-white border rounded-xl p-4 shadow-sm h-[320px]">
            <h4 className="font-semibold text-slate-800 mb-2 text-sm">
              Tinggi Air (cm)
            </h4>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeLabel" />
                <YAxis />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)} cm`, "Tinggi Air"]}
                  labelFormatter={(l) => `Waktu: ${l}`}
                />

                {/* Threshold lines */}
                <ReferenceLine
                  y={MOUNT_HEIGHT_CM * 0.6}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                />
                <ReferenceLine
                  y={MOUNT_HEIGHT_CM * 0.85}
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                />

                {/* NORMAL */}
                <Line
                  dataKey="water_normal"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />

                {/* WASPADA */}
                <Line
                  dataKey="water_waspada"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />

                {/* SIAGA */}
                <Line
                  dataKey="water_siaga"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ===== TABLE ===== */}
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
                  const level = getStatusLevel(
                    r.water_level_cm,
                    MOUNT_HEIGHT_CM
                  );
                  return (
                    <tr key={i} className="border-t">
                      <td className="py-1.5">{r.dateTimeLabel}</td>
                      <td className="text-right">
                        {r.water_level_cm.toFixed(1)}
                      </td>
                      <td className="text-right">
                        {r.distance_cm.toFixed(1)}
                      </td>
                      <td className="text-right">
                        {statusLabelMap[level]}
                      </td>
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
