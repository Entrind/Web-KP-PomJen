import { useState } from "react";
import { loadSites, saveSites, DEFAULT_SITES } from "../config/sites";

const FIELDS = [
  { key: "name",            label: "Nama Pos" },
  { key: "river_name",      label: "Nama Lokasi" },
  { key: "sheet_id",        label: "Sheet ID" },
  { key: "gid",             label: "GID (Tab Sheet)" },
  { key: "mount_height_cm", label: "Tinggi Dudukan (cm)", type: "number" },
];
const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === "true";
export default function AdminConfig() {
  const [sites, setSites]   = useState(loadSites);
  const [saved, setSaved]   = useState(false);

  if (!ENABLE_ADMIN) {
    return (
      <div className="text-slate-400 text-sm p-4">
        Halaman tidak tersedia.
      </div>
    );
  }
  
  function handleChange(idx, field, value) {
    setSites((prev) =>
      prev.map((s, i) =>
        i !== idx ? s : {
          ...s,
          [field]: field === "mount_height_cm" ? Number(value) : value,
        }
      )
    );
    setSaved(false);
  }

  function handleAdd() {
    setSites((prev) => [
      ...prev,
      {
        id: `pos-${Date.now()}`,
        name: "Pos Baru",
        river_name: "",
        sheet_id: "",
        gid: "0",
        mount_height_cm: 80,
      },
    ]);
    setSaved(false);
  }

  function handleRemove(idx) {
    if (!confirm("Hapus pos ini?")) return;
    setSites((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function handleSave() {
    saveSites(sites);
    setSaved(true);
  }

  function handleReset() {
    if (!confirm("Reset ke konfigurasi default?")) return;
    setSites(DEFAULT_SITES);
    saveSites(DEFAULT_SITES);
    setSaved(true);
  }

  return (
    <div className="grid gap-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-50 text-lg">
          Konfigurasi Pos
        </h3>
        <button
          onClick={handleAdd}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
        >
          + Tambah Pos
        </button>
      </div>

      {/* SITE CARDS */}
      {sites.map((site, idx) => (
        <div
          key={site.id}
          className="bg-white border rounded-xl p-4 shadow-sm grid gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 text-sm">
              Pos #{idx + 1}
            </span>
            <button
              onClick={() => handleRemove(idx)}
              className="text-xs text-red-500 hover:underline"
            >
              Hapus
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {FIELDS.map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-xs text-slate-500 mb-1 block">
                  {label}
                </label>
                <input
                  type={type ?? "text"}
                  value={site[key]}
                  onChange={(e) => handleChange(idx, key, e.target.value)}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}

            {/* Preview URL */}
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">
                Preview URL Sheet
              </label>
              <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 break-all">
                {site.sheet_id
                  ? `https://docs.google.com/spreadsheets/d/${site.sheet_id}/export?format=csv&gid=${site.gid}`
                  : "— isi Sheet ID terlebih dahulu —"}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ACTIONS */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
        >
          {saved ? "✓ Tersimpan" : "Simpan Konfigurasi"}
        </button>
        <button
          onClick={handleReset}
          className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-300"
        >
          Reset Default
        </button>
      </div>
    </div>
  );
}