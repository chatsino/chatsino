import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export interface ClientContextType {
  client: null | ChatsinoUser;
  setClient: Dispatch<React.SetStateAction<null | ChatsinoUser>>;
}

export const ClientContext = createContext<ClientContextType>({
  client: null,
  setClient() {},
});

export function ClientProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<null | ChatsinoUser>(null);
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
