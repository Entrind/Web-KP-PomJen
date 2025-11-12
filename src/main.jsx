import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import Overview from "./pages/Overview.jsx";
import DetailPos from "./pages/DetailPos.jsx";
import Inventaris from "./pages/inventory/Inventaris.jsx";

const qc = new QueryClient();

const ENABLE_INV = import.meta.env.VITE_ENABLE_INVENTORY === "true";

const router = createBrowserRouter([
  { path: "/", element: <App />, children: [
    { index: true, element: <Overview /> },
    { path: "sites/:id", element: <DetailPos /> },
    (ENABLE_INV ? [{ path: "inventaris", element: <Inventaris /> }] : []),
  ] }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={qc}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
