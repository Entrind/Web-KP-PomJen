import { Link, Outlet, useLocation } from "react-router-dom";

export default function App() {
  const ENABLE_INV = import.meta.env.VITE_ENABLE_INVENTORY === "true";
  const { pathname } = useLocation();

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium
      ${
        pathname === to
          ? "bg-white/20 text-white"
          : "text-white/80 hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 -z-10">
        <div className="h-[35vh] bg-gradient-to-br from-blue-900 to-blue-500" />
        <div className="h-[65vh] bg-slate-50" />
      </div>

      <header className="border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="font-semibold text-lg text-white">
            SIH • Monitoring
          </div>
          <nav className="ml-auto flex items-center gap-2">
            <NavLink to="/">Overview</NavLink>
            <NavLink to="/riwayat">Riwayat</NavLink>
            {ENABLE_INV && <NavLink to="/inventaris">Inventaris</NavLink>}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
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
