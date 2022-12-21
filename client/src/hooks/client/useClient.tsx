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
  setClient: Dispatch<React.SetStateAction<null | SafeClient>>;
}

export const ClientContext = createContext<ClientContextType>({
  client: null,
  setClient() {},
});

export function ClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<null | SafeClient>(null);
  const value = useMemo(
    () => ({
      client,
      setClient,
    }),
    [client]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
