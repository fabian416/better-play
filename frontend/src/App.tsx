"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { Routes, Route } from "react-router-dom";
import HomePage from "~~/pages/home";
import MatchPage from "~~/pages/match";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export function App() {
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
