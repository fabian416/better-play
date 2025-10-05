import React, { ReactNode, createContext, useContext, useState } from "react";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import type { WalletClient } from "viem";
import { useDisconnect, useWalletClient } from "wagmi";
import { XOConnectProvider } from "xo-connect";
import { useEmbedded } from "~~/providers/embedded-context";
import { getSettings } from "~~/lib/settings";
import { BETTER_PLAY_ADDRESS, USDC_ADDRESS } from "~~/lib/constants";
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";

interface ContractsContextType {
  contracts: () => Promise<any>;
}

interface ContractsProviderProps {
  children: ReactNode;
}

const ContractsContext = createContext<ContractsContextType | null>(null);

function walletClientToEip1193Provider(walletClient: WalletClient): Eip1193Provider {
  return walletClient.transport as Eip1193Provider;
}

export const ContractsProvider: React.FC<ContractsProviderProps> = ({ children }) => {
  const [values, setValues] = useState<any>(null);
  const settings = getSettings();
  const { data: walletClient } = useWalletClient();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { isEmbedded } = useEmbedded();

  const contracts = async () => {
    if (values) {
      return values;
    }
    
    const chainIdHex = settings.polygon.chainIdHex; 
    const chainId = settings.polygon.chainId; 
    const polygonRpc = settings.polygon.rpcUrls?.[chainId];

    const connectEmbedded = (): {
      provider: XOConnectProvider;
      disconnect: () => Promise<void>;
    } => {
      const provider = new XOConnectProvider({
        rpcs: { [chainIdHex]: polygonRpc },
        defaultChainId: chainIdHex,
      });

      return {
        provider,
        disconnect: async () => {},
      };
    };

    const connectNormal = (): { provider: Eip1193Provider; disconnect: () => Promise<void> } => {
      if (!walletClient) throw new Error("Wallet client not found");

      const provider = walletClientToEip1193Provider(walletClient);
      const disconnect = async () => {
        wagmiDisconnect();
        setValues(null);
      };

      return { provider, disconnect };
    };

    const { provider, disconnect } = isEmbedded ? connectEmbedded() : connectNormal();

    if ("on" in provider && typeof provider.on === "function") {
      provider.on("accountsChanged", async () => {
        await disconnect();
        setValues(null);
      });
      provider.on("disconnect", () => {
        setValues(null);
      });
    }

    const ethersProvider = new BrowserProvider(provider);
    const signer = await ethersProvider.getSigner(0);

    const betterPlayAddress = BETTER_PLAY_ADDRESS;
    const usdcAddress = USDC_ADDRESS;

    const betterPlayABI = BETTER_PLAY_ABI;
    const usdcABI = ERC20_ABI;
    if (!usdcABI) {
      throw new Error(`USDC ABI not found for chain ${chainId}`);
    }

    const betterPlay = new ethers.Contract(betterPlayAddress, betterPlayABI, signer);
    const usdc = new ethers.Contract(usdcAddress, usdcABI, signer);
    const connectedAddress = await signer.getAddress();

    const newVals = {
      betterPlay,
      usdc,
      betterPlayAddress,
      usdcAddress,
      signer,
      connectedAddress,
      provider,
      disconnect,
    };
    setValues(newVals);
    return newVals;
  };

  return <ContractsContext.Provider value={{ contracts }}>{children}</ContractsContext.Provider>;
};

export const useContracts = () => {
  const context = useContext(ContractsContext);
  if (!context) {
    throw new Error("useContracts must be used within a <ContractsProvider>");
  }
  return context;
};
