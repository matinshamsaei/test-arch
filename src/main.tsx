import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";

import App from "@presentation/App.tsx";

import { createContainer } from "@composition/container.ts";
import { SchedulingStoreProvider, createSchedulingStore } from "@presentation/store";

import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing.");

const store = createSchedulingStore(createContainer());

createRoot(root).render(
  <StrictMode>
    <SchedulingStoreProvider store={store}>
      <App />
    </SchedulingStoreProvider>
  </StrictMode>,
);
