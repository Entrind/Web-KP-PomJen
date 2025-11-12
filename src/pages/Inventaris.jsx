import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useState } from "react";

export default function Inventaris() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey:["assets"], queryFn: async () => (await api.get("/assets")).data });
  const [draft, setDraft] = useState({ code:"", name:"", type:"sensor", site_id:"POS-AB01", status:"aktif", notes:"" });
  const add = useMutation({
    mutationFn: async (payload) => (await api.post("/assets", payload)).data,
    onSuccess: ()=> qc.invalidateQueries({ queryKey:["assets"] })
  });

  return (
    <div style={{ display:"grid", gap:12 }}>
      <h3>Inventaris</h3>
      <div style={{ display:"flex", gap:8 }}>
        <input placeholder="Kode" value={draft.code} onChange={e=>setDraft({...draft, code:e.target.value})}/>
        <input placeholder="Nama" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
        <button onClick={()=> add.mutate(draft)}>Tambah</button>
      </div>
      <table width="100%">
        <thead><tr><th>Kode</th><th>Nama</th><th>Tipe</th><th>Site</th><th>Status</th></tr></thead>
        <tbody>
          {(data||[]).map(a=>(
            <tr key={a.id}><td>{a.code}</td><td>{a.name}</td><td>{a.type}</td><td>{a.site_id}</td><td>{a.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
