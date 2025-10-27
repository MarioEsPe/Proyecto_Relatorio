// relatorio-ui/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- 1. Importar React Query ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- 2. Crear el Cliente ---
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- 3. Envolver la App --- */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
