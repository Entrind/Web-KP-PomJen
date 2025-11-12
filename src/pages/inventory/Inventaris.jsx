export default function Inventaris() {
  const rows = [
    { id: 1, code: "A-001", name: "Ultrasonic A02YYUW", type: "sensor", site_id: "POS-AB01", status: "aktif" },
  ];
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-3">Inventaris</h3>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr><th>Kode</th><th>Nama</th><th>Tipe</th><th>Site</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id} className="border-t">
              <td className="py-1.5">{a.code}</td>
              <td>{a.name}</td>
              <td>{a.type}</td>
              <td>{a.site_id}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
