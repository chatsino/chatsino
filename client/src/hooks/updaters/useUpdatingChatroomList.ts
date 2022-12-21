import { useSocket } from "hooks";
import { ChatroomListLoaderData } from "loaders";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { CHATROOM_SUBSCRIPTIONS } from "subscriptions";
import uuid from "uuid4";

export function useUpdatingChatroomList() {
  const identifier = useRef(uuid());
  const { chatrooms: initialChatrooms } =
    useLoaderData() as ChatroomListLoaderData;
  const { subscribe, unsubscribe } = useSocket();
  const [chatrooms, setChatrooms] = useState(initialChatrooms);

  useEffect(() => {
    const relevantIdentifier = identifier.current;
    const subscriptions = [] as string[];

    for (const chatroom of chatrooms) {
      const subscription = CHATROOM_SUBSCRIPTIONS.chatroomUpdated(chatroom.id);

      // eslint-disable-next-line no-loop-func
      subscribe(relevantIdentifier, subscription, (response) => {
        const { chatroom: updatedChatroom } = response.data as {
          chatroom: ChatroomData;
        };

        setChatrooms((prev) =>
          prev.map((existingChatroom) =>
            existingChatroom.id === updatedChatroom.id
              ? updatedChatroom
              : existingChatroom
          )
        );
      });

      subscriptions.push(subscription);
    }

    return () => {
      for (const subscription of subscriptions) {
        unsubscribe(relevantIdentifier, subscription);
      }
    };
  }, [subscribe, unsubscribe, chatrooms]);

  return {
    chatrooms,
  };
}
