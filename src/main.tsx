import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";

import App from "@presentation/app/App.tsx";
import { createAppStores } from "@presentation/app/features.ts";
import { AppStoresProvider } from "@presentation/app/providers.tsx";
import { createQueryClient } from "@presentation/app/query-client.ts";
import { createContainer } from "@composition/container.ts";

import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing.");

const stores = createAppStores(createContainer());
const queryClient = createQueryClient();

createRoot(root).render(
  <StrictMode>
    <AppStoresProvider stores={stores} queryClient={queryClient}>
      <App />
    </AppStoresProvider>
  </StrictMode>,
);
