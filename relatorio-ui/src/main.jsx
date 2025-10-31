// relatorio-ui/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { initializeAuthStore, useAuthStore } from './store/authStore.js';

const queryClient = new QueryClient();

initializeAuthStore(queryClient);

useAuthStore.getState().checkAuth();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- Envolver la App --- */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
