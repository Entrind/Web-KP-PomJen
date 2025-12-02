import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const ENABLE_INV = import.meta.env.VITE_ENABLE_INVENTORY === "true";
  const { pathname } = useLocation();

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium
      ${pathname === to ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-100"}`}
    >
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-semibold text-lg text-slate-800">
            SIH • Monitoring
          </div>
          <nav className="ml-auto flex items-center gap-2">
            <NavLink to="/">Overview</NavLink>
            <NavLink to="/riwayat">Riwayat</NavLink>
            {ENABLE_INV && <NavLink to="/inventaris">Inventaris</NavLink>}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-slate-500">
          Prototype • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
