"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { wagmiConfig } from "~~/providers/WagmiConfig";
import { EmbeddedProvider } from "./providers/EmbeddedContext";
import HomePage from "~~/pages/home";
import MatchPage from "~~/pages/match";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function Shell() {
  return (
    <>
      <ToastContainer position="top-right" />
      <Toaster />
      <RainbowKitProvider>
        <div className="flex min-h-screen flex-col">
          <main className="relative flex flex-1 flex-col">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/match/:id" element={<MatchPage />} />
            </Routes>
          </main>
        </div>
      </RainbowKitProvider>
    </>
  );
}

export function EthAppWithProviders() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <EmbeddedProvider>
          <Shell />
        </EmbeddedProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
