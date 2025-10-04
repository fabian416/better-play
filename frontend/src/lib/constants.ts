import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getEnv = (key: string, fallback?: string) => {
  const val = (import.meta as any).env?.[key] as string | undefined
  if (val == null || val === "") return fallback
  return val
}

export const BETTER_PLAY_ADDRESS = getEnv("VITE_BETTER_PLAY_ADDRESS", "0x0000000000000000000000000000000000000000")!
export const USDC_ADDRESS = getEnv("VITE_USDC_ADDRESS", "0x0000000000000000000000000000000000000000")!
export const CHAIN_ID = Number(getEnv("VITE_CHAIN_ID", "137"))
export const WALLET_CONNECT_PROJECT_ID = getEnv("VITE_WALLET_CONNECT_PROJECT_ID", "");