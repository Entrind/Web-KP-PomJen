import { Outlet, Link } from "react-router-dom";
export default function App() {
  const ENABLE_INV = import.meta.env.VITE_ENABLE_INVENTORY === "true";
  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display:"flex", gap:16, marginBottom:12 }}>
        <h3 style={{ marginRight:"auto" }}>Monitoring</h3>
        <Link to="/">Overview</Link>{ENABLE_INV && <Link to="/inventaris">Inventaris</Link>}
        <Link to="/inventaris">Inventaris</Link>
      </header>
      <Outlet/>
    </div>
  );
}
