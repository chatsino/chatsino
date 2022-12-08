import { SiteLayout } from "ui";
import { Outlet, useLoaderData } from "react-router-dom";
import { SafeClient } from "schemas";
import { useEffect, useRef } from "react";
import {
  ClientProvider,
  SocketProvider,
  useAuthentication,
  useClient,
} from "hooks";

export function RootRoute() {
  return (
    <ClientProvider>
      <SocketProvider>
        <SiteLayout>
          <Inner />
        </SiteLayout>
      </SocketProvider>
    </ClientProvider>
  );
}

function Inner() {
  const { validate } = useAuthentication();
  const { client, setClient } = useClient();
  const data = useLoaderData() as { client: SafeClient };
  const initiallyValidated = useRef(false);

  useEffect(() => {
    if (data?.client && !client) {
      setClient(data.client);
    }
  }, [data, client, setClient]);

  useEffect(() => {
    if (!initiallyValidated.current) {
      initiallyValidated.current = true;

      const handleValidate = async () => {
        try {
          const client = await validate();

          if (client) {
            setClient(client);
          }
        } catch (error) {}
      };

      handleValidate();
    }
  }, [validate, setClient]);

  return <Outlet />;
}
