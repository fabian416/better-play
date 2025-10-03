import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "@rainbow-me/rainbowkit/styles.css"
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { polygon, polygonAmoy } from "wagmi/chains"
import "@/styles/globals.css"

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string

const config = getDefaultConfig({
  appName: "BetterPlay",
  projectId,
  chains: [polygon, polygonAmoy],
  ssr: false,
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme({ accentColor: "#7c3aed" })}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)