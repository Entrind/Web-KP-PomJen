import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

export default function DetailPos() {
  const { id } = useParams();
  const { data: devices } = useQuery({ queryKey:["devices", id], queryFn: async () => (await api.get(`/devices?site_id=${id}`)).data });
  const dev = devices?.[0];
  const { data: rows } = useQuery({
    queryKey:["readings", dev?.id],
    enabled: !!dev,
    queryFn: async () => (await api.get(`/readings?device_id=${dev.id}&_sort=ts&_order=asc`)).data
  });

  const chartData = useMemo(() => (rows||[]).map(r=>({
    t: new Date(r.ts).toLocaleTimeString(),
    wl: r.water_level_cm
  })), [rows]);

  return (
    <div style={{ display:"grid", gap:12 }}>
      <h3>Detail Pos: {id}</h3>
      <div style={{ height:300, border:"1px solid #ddd", borderRadius:8, padding:8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid />
            <XAxis dataKey="t" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="wl" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ border:"1px solid #ddd", borderRadius:8, padding:8 }}>
        <table width="100%">
          <thead><tr><th align="left">Waktu</th><th align="right">Level (cm)</th><th align="right">Battery (V)</th></tr></thead>
          <tbody>
            {(rows||[]).slice().reverse().map(r=>(
              <tr key={r.id}>
                <td>{new Date(r.ts).toLocaleString()}</td>
                <td align="right">{r.water_level_cm}</td>
                <td align="right">{r.battery_v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
