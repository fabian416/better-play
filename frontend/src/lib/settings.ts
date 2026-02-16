const development = {
  environment: "development",
  polygon: {
    chainId: 80002,
    chainIdHex: "0x13882",
    rpcUrls: {
      80002: "https://polygon-amoy.g.alchemy.com/v2/pMAx1NTZTUfCpDkVsjEC3zdKHhOQ4IQ6",
    },
    supportedChains: [
      {
        chainId: "0x13882",
        chainName: "Polygon Amoy",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        blockExplorerUrls: ["https://amoy.polygonscan.com"],
        iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
      },
    ],
  },
} as const;

const staging = {
  environment: "staging",
  polygon: {
    chainId: 80002,
    chainIdHex: "0x13882",
    rpcUrls: {
      80002: "https://polygon-amoy.g.alchemy.com/v2/pMAx1NTZTUfCpDkVsjEC3zdKHhOQ4IQ6",
    },
    supportedChains: [
      {
        chainId: "0x13882",
        chainName: "Polygon Amoy",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology"],
        blockExplorerUrls: ["https://amoy.polygonscan.com"],
        iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
      },
    ],
  },
} as const;

const production = {
  environment: "production",
  polygon: {
    chainId: 137,
    chainIdHex: "0x89",
    rpcUrls: {
      137: "https://polygon-mainnet.g.alchemy.com/v2/pMAx1NTZTUfCpDkVsjEC3zdKHhOQ4IQ6",
    },
    supportedChains: [
      {
        chainId: "0x89",
        chainName: "Polygon",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://polygon-rpc.com"],
        blockExplorerUrls: ["https://polygonscan.com"],
        iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
      },
    ],
  },
} as const;

type ChainConfig = {
  chainId: number;
  chainIdHex: string;
  rpcUrls: { [key: number]: string };
  supportedChains: ReadonlyArray<{
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: readonly string[];
    blockExplorerUrls: readonly string[];
    iconUrls: readonly string[];
  }>;
};

export type SettingsType = {
  environment: "development" | "staging" | "production";
  polygon: ChainConfig;
};

export const allSettings: Record<string, SettingsType> = {
  "http://localhost:3002": development,
  "http://127.0.0.1:3002": development,
  "https://staging.better-play.zk-access.xyz": staging,
  "https://better-play.zk-access.xyz": production,
  default: production,
};

export const getSettings = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "default";
  return allSettings[origin] || allSettings.default;
};

