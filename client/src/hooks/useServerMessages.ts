import { message as showMessage } from "ui";
import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { ServerMessageSocketRequests } from "enums";

export const SERVER_MESSAGE_SUBSCRIBER_NAME = "server-message";

export function useServerMessages() {
  const { subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    subscribe(
      SERVER_MESSAGE_SUBSCRIBER_NAME,
      ServerMessageSocketRequests.ClientSuccessMessage,
      (response) => showMessage.success(response.message)
    );

    subscribe(
      SERVER_MESSAGE_SUBSCRIBER_NAME,
      ServerMessageSocketRequests.ClientErrorMessage,
      (response) => showMessage.error(response.message)
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
