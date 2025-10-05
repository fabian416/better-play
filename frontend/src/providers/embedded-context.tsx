import { createContext, useContext, ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ContractsProviderProps {
  children: ReactNode;
}

interface ContextType {
  isEmbedded: string | boolean | null;
}

const EmbeddedContext = createContext<ContextType | null>(null);

export const EmbeddedProvider: React.FC<ContractsProviderProps> = ({ children }) => {
  const { pathname } = useLocation();
  const isEmbedded = pathname.toLowerCase().includes("embedded");

  return <EmbeddedContext.Provider value={{ isEmbedded }}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = () => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};