import { createConfig, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { WALLET_CONNECT_PROJECT_ID } from "~~/lib/constants";
import { getSettings } from "~~/lib/settings";

const appName = "BetterPlay";
const projectId = WALLET_CONNECT_PROJECT_ID;

const settings = getSettings();
const targetId = settings.polygon.chainId; // 137 o 80002
const chain = targetId === polygon.id ? polygon : polygonAmoy;

// Elegí el RPC según el chain activo
const activeRpc =
  chain.id === polygon.id
    ? settings.polygon.rpcUrls[polygon.id] ?? polygon.rpcUrls.default.http[0]
    : settings.polygon.rpcUrls[polygonAmoy.id] ?? polygonAmoy.rpcUrls.default.http[0];

export const wagmiConfig = createConfig({
  ssr: false,
  chains: [chain] as const,
  transports: {
    [chain.id]: http(activeRpc),
  },
  connectors: projectId
    ? [injected(), coinbaseWallet({ appName }), walletConnect({ projectId })]
    : [injected(), coinbaseWallet({ appName })],
});
