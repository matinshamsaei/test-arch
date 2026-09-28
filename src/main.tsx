import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import { createContainer } from './composition/container.ts';
import App from './presentation/App.tsx';
import { SchedulingStoreProvider } from './presentation/SchedulingStoreProvider.tsx';
import { createSchedulingStore } from './presentation/store.ts';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing.');

const store = createSchedulingStore(createContainer());

createRoot(root).render(
  <StrictMode>
    <SchedulingStoreProvider store={store}>
      <App />
    </SchedulingStoreProvider>
  </StrictMode>,
);
