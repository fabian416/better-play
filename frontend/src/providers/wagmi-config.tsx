import { createConfig, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { WALLET_CONNECT_PROJECT_ID } from "~~/lib/constants";
import { getSettings } from "~~/lib/settings";

const appName = "BetterPlay";
const projectId = WALLET_CONNECT_PROJECT_ID;

const settings = getSettings();
const targetId = settings.polygon.chainId; // 137 or 80002
const chain = targetId === polygon.id ? polygon : polygonAmoy;

const polygonRpc =
  settings.polygon.rpcUrls[polygon.id] ?? polygon.rpcUrls.default.http[0];
const amoyRpc =
  settings.polygon.rpcUrls[polygonAmoy.id] ?? polygonAmoy.rpcUrls.default.http[0];

export const wagmiConfig = createConfig({
  ssr: false,
  chains: [chain] as const,
  transports: {
    [polygon.id]: http(polygonRpc),
    [polygonAmoy.id]: http(amoyRpc),
  } as const, // <- satisfy Record<137 | 80002, Transport>
  connectors: projectId
    ? [injected(), coinbaseWallet({ appName }), walletConnect({ projectId })]
    : [injected(), coinbaseWallet({ appName })],
});
