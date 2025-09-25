// main.jsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));

async function enableMocking() {
  if (import.meta.env.MODE !== "development") {
    return;
  }
  const { worker } = await import("./mocks/browser");
  return worker.start().then(() => {
    console.log("[MSW] worker started");
  });
}

enableMocking().then(() => {
  root.render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
});
