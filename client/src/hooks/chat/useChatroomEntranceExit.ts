import { ClientSocketRequests } from "enums";
import { useSocket } from "hooks";
import { useEffect } from "react";

export function useChatroomEntranceExit(chatroomId: number) {
  const { makeRequest } = useSocket();

  useEffect(() => {
    makeRequest(ClientSocketRequests.ClientEnteredChatroom);

    return () => {
      makeRequest(ClientSocketRequests.ClientExitedChatroom);
    };
  }, [chatroomId]);
}
