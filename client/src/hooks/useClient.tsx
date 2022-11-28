import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { SafeClient } from "schemas";

export interface ClientContextType {
  client: null | SafeClient;
  chips: number;
  setClient: Dispatch<React.SetStateAction<null | SafeClient>>;
  setChips: Dispatch<React.SetStateAction<number>>;
}

const ClientContext = createContext<ClientContextType>({
  client: null,
  chips: 0,
  setClient() {},
  setChips() {},
});

export function ClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<null | SafeClient>(null);
  const [chips, setChips] = useState(0);
  const value = useMemo(
    () => ({
      client,
      chips,
      setClient,
      setChips,
    }),
    [client, chips]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
