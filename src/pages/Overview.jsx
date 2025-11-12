import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Overview() {
  const { data: sites } = useQuery({ queryKey:["sites"], queryFn: async () => (await api.get("/sites")).data });
  const { data: devices } = useQuery({ queryKey:["devices"], queryFn: async () => (await api.get("/devices")).data });
  const { data: readings } = useQuery({ queryKey:["readings"], queryFn: async () => (await api.get("/readings?_sort=ts&_order=desc&_limit=1")).data });

  const last = readings?.[0];
  return (
    <div style={{ display:"grid", gap:12 }}>
      <div style={{ border:"1px solid #ddd", borderRadius:8, padding:12 }}>
        <h4>Pos</h4>
        {sites?.map(s => (
          <div key={s.id} style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div><b>{s.name}</b> ({s.id})</div>
              <div>Sungai: {s.river_name}</div>
            </div>
            <Link to={`/sites/${s.id}`}>Detail</Link>
          </div>
        ))}
      </div>
      <div style={{ border:"1px solid #ddd", borderRadius:8, padding:12 }}>
        <h4>Ringkasan Terakhir</h4>
        {last ? (
          <div>Level air: <b>{last.water_level_cm} cm</b> • Baterai: {last.battery_v} V • {new Date(last.ts).toLocaleString()}</div>
        ) : <i>Belum ada data</i>}
      </div>
    </div>
  );
}
