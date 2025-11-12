import { useParams, Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const mock = Array.from({ length: 24 }).map((_, i) => ({
  t: `${String(i).padStart(2,"0")}:00`,
  wl: 160 + Math.round(Math.sin(i/3)*8 + Math.random()*4),
}));

export default function DetailPos() {
  const { id } = useParams();
  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-blue-700 hover:underline text-sm">← Kembali</Link>
        <h3 className="font-semibold text-slate-800 text-lg">Detail Pos: {id}</h3>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mock}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="wl" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th>Waktu</th><th className="text-right">Level (cm)</th></tr>
          </thead>
          <tbody>
            {[...mock].reverse().map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-1.5">{r.t}</td>
                <td className="text-right">{r.wl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
