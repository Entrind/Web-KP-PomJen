import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import Overview from "./pages/Overview.jsx";
import DetailPos from "./pages/DetailPos.jsx";
import Riwayat from "./pages/Riwayat.jsx";

const ENABLE_INV = import.meta.env.VITE_ENABLE_INVENTORY === "true";
const qc = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: "sites/:id", element: <DetailPos /> },
      { path: "riwayat", element: <Riwayat /> },
      ...(ENABLE_INV ? [{ path: "inventaris", element: <Inventaris /> }] : []),
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={qc}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
