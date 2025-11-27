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

// misal: jarak sensor -> dasar (H) = 100 cm
const MOUNT_HEIGHT_CM = 100;

// dummy pembacaan dari ESP32 setiap jam (24 jam terakhir)
const mockReadingsFromEsp = Array.from({ length: 24 }).map((_, i) => {
  // buat timestamp per jam ke belakang
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() - (23 - i)); // 24 titik mundur

  // simulasi jarak sensor -> permukaan air (distance_cm)
  const distance_cm = 40 + Math.round(Math.sin(i / 3) * 5 + Math.random() * 3);
  const water_level_cm = Math.max(MOUNT_HEIGHT_CM - distance_cm, 0);

  return {
    ts: d.toISOString(),
    hourLabel: d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    distance_cm,
    water_level_cm,
  };
});

export default function DetailPos() {
  const { id } = useParams();

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

      <div className="bg-white border rounded-xl p-4 shadow-sm h-[320px]">
        <h4 className="font-semibold text-slate-800 mb-2 text-sm">
          Tinggi Air (cm) – 24 jam terakhir
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockReadingsFromEsp}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hourLabel" />
            <YAxis />
            <Tooltip
              formatter={(value, name) =>
                name === "water_level_cm"
                  ? [`${value} cm`, "Tinggi Air"]
                  : [`${value} cm`, "Jarak Sensor-Air"]
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

      {/* Tabel detail per jam */}
      <div className="bg-white border rounded-xl p-4 shadow-sm overflow-auto">
        <h4 className="font-semibold text-slate-800 mb-2 text-sm">
          Riwayat Tinggi Air per Jam
        </h4>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th>Waktu</th>
              <th className="text-right">Tinggi Air (cm)</th>
            </tr>
          </thead>
          <tbody>
            {[...mockReadingsFromEsp].reverse().map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-1.5">{r.hourLabel}</td>
                <td className="text-right">{r.water_level_cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
