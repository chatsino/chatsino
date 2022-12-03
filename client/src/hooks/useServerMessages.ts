import { message } from "antd";
import { useEffect } from "react";
import { useSocket } from "./useSocket";

export const SERVER_MESSAGE_SUBSCRIBER_NAME = "server-message";

export enum ServerMessageSocketRequests {
  ClientSuccessMessage = "client-success-message",
  ClientErrorMessage = "client-error-message",
}

export function useServerMessages() {
  const { subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    subscribe(
      SERVER_MESSAGE_SUBSCRIBER_NAME,
      ServerMessageSocketRequests.ClientSuccessMessage,
      (response) => message.success(response.message)
    );

    subscribe(
      SERVER_MESSAGE_SUBSCRIBER_NAME,
      ServerMessageSocketRequests.ClientErrorMessage,
      (response) => message.error(response.message)
    );

    return () => {
      unsubscribe(
        SERVER_MESSAGE_SUBSCRIBER_NAME,
        ServerMessageSocketRequests.ClientSuccessMessage
      );

      unsubscribe(
        SERVER_MESSAGE_SUBSCRIBER_NAME,
        ServerMessageSocketRequests.ClientErrorMessage
      );
    };
  }, [subscribe, unsubscribe]);
}
