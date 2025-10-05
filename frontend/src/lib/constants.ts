import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getSettings } from "~~/lib/settings";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Vite env reader */
export const getEnv = (key: string, fallback?: string) => {
  const val = (import.meta as any).env?.[key] as string | undefined;
  if (val == null || val === "") return fallback;
  return val;
};
export const getEnvRequired = (key: string) => {
  const v = getEnv(key);
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v!;
};

const s = getSettings();

// Consideramos MAINNET si el environment es "production" o si el chainId es 137.
const IS_MAINNET = s.environment === "production" || s.polygon.chainId === 137;
const NET = IS_MAINNET ? "MAINNET" : "TESTNET";

export const ENVIRONMENT = s.environment;                 // "development" | "staging" | "production"
export const CHAIN_ID = s.polygon.chainId;                // p.ej. 80002 o 137
export const CHAIN_ID_HEX = s.polygon.chainIdHex;         // p.ej. "0x13882" o "0x89"

// Addresses por NET, obligatorios (así falla fuerte si te olvidás).
export const BETTER_PLAY_ADDRESS = getEnvRequired(`VITE_BETTER_PLAY_ADDRESS_${NET}`);
export const USDC_ADDRESS        = getEnvRequired(`VITE_USDC_ADDRESS_${NET}`);

// Exponer flag para la UI
export const IS_PROD_NETWORK = IS_MAINNET;

export const WALLET_CONNECT_PROJECT_ID = getEnv("VITE_WALLET_CONNECT_PROJECT_ID", "");