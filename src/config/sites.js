export const DEFAULT_SITES = [
  {
    id: "pos-1",
    name: "Pos 1",
    river_name: "Baskom Mandi",
    sheet_id: "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE",
    gid: "1838368434",
    mount_height_cm: 80,
  },
  {
    id: "pos-2",
    name: "Pos 2",
    river_name: "Sungai",
    sheet_id: "1D9hhtOm1HAewYi0s_PXx1Q2AczKHHkBOS4gy7xt5PVE",
    gid: "0",
    mount_height_cm: 300,
  },
];

const STORAGE_KEY = "awlr_sites_config";

export function loadSites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SITES;
  } catch {
    return DEFAULT_SITES;
  }
}

export function saveSites(sites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export function getSheetUrl(site) {
  return `https://docs.google.com/spreadsheets/d/${site.sheet_id}/export?format=csv&gid=${site.gid}`;
}