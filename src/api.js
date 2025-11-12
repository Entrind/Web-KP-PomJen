import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE });

// Monitoring
export const getSites = () => api.get("/sites").then(r=>r.data);
export const getDevicesBySite = (siteId) => api.get(`/devices?site_id=${siteId}`).then(r=>r.data);
export const getReadings = (deviceId) => api.get(`/readings?device_id=${deviceId}&_sort=ts&_order=asc`).then(r=>r.data);

// Inventaris (opsional)
export const getAssets = () => api.get("/assets").then(r=>r.data);
export const createAsset = (payload) => api.post("/assets", payload).then(r=>r.data);
