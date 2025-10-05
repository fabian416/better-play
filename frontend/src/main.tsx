import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "~~/providers/wagmi-config";
import { EmbeddedProvider } from "./providers/embedded-context";
import { ContractsProvider } from './providers/contracts-context';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from './App';
import "~~/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';


const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <EmbeddedProvider>
              <ContractsProvider>
                <App />
              </ContractsProvider>
            </EmbeddedProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
)
