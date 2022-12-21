import { notification as showNotification, LogoutOutlined } from "ui";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClientSocketRequests, useClient } from "./useClient";
import { useSocket } from "../useSocket";

export function useTokenExpiration() {
  const { client, setClient } = useClient();
  const { subscribe, unsubscribe } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (client) {
      subscribe(
        useTokenExpiration.name,
        ClientSocketRequests.ClientTokenExpired,
        () => {
          setClient(null);
          navigate("/signin");

          showNotification.error({
            icon: <LogoutOutlined />,
            message: "Signed out",
            description:
              "You have been signed out. Please sign in again to continue.",
          });
        }
      );

      return () => {
        unsubscribe(
          useTokenExpiration.name,
          ClientSocketRequests.ClientTokenExpired
        );
      };
    }
  }, [client, subscribe, unsubscribe, navigate, setClient]);
}
