import { ChatroomSocketRequests } from "enums";
import { useSocket } from "hooks";
import { useEffect } from "react";

export function useChatroomEntranceExit(chatroomId: number) {
  const { makeRequest, initialized } = useSocket();

  useEffect(() => {
    makeRequest(ChatroomSocketRequests.ClientEnteredChatroom, {
      chatroomId,
    });

    return () => {
      makeRequest(ChatroomSocketRequests.ClientExitedChatroom, {
        chatroomId,
      });
    };
  }, [chatroomId, initialized]);
}
