import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocket } from "../useSocket";

export enum ChatroomSocketRequests {
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",
  SendChatMessage = "send-chat-message",
  VoteInPoll = "vote-in-poll",
  NewChatMessage = "new-chat-message",
}

export const ChatroomContext = createContext<{
  data: {
    chatroomMessages: Record<number, ChatMessageData[]>;
    chatrooms: ChatroomData[];
    users: ChatUserData[];
  };
  requests: {
    fetchChatrooms(): Promise<void>;
    fetchChatroomMessages(chatroomId: number): Promise<void>;
    sendChatMessage(
      chatroomId: number,
      message: string,
      poll?: ChatMessagePollData
    ): Promise<void>;
    voteInPoll(messageId: number, response: string): Promise<void>;
  };
}>({
  data: {
    chatroomMessages: {},
    chatrooms: [],
    users: [],
  },
  requests: {
    fetchChatrooms: Promise.resolve,
    fetchChatroomMessages: Promise.resolve,
    sendChatMessage: Promise.resolve,
    voteInPoll: Promise.resolve,
  },
});

export function ChatroomProvider({ children }: { children?: ReactNode }) {
  const { oneTimeRequest, initialized } = useSocket();
  const [chatrooms, setChatrooms] = useState([] as Array<ChatroomData>);
  const [chatroomMessages, setChatroomMessages] = useState(
    {} as Record<number, ChatMessageData[]>
  );
  const initiallyFetched = useRef(false);

  const fetchChatrooms = useCallback(async () => {
    const response = await oneTimeRequest(ChatroomSocketRequests.ListChatrooms);

    if (response.error) {
      // TODO
    } else {
      const { chatrooms } = response.data as {
        chatrooms: ChatroomData[];
      };

      setChatrooms(chatrooms);
    }
  }, [oneTimeRequest]);

  const fetchChatroomMessages = useCallback(
    async (chatroomId: number) => {
      const response = await oneTimeRequest(
        ChatroomSocketRequests.ListChatroomMessages,
        { chatroomId }
      );

      if (response.error) {
        // TODO
      } else {
        const { messages } = response.data as {
          messages: ChatMessageData[];
        };

        setChatroomMessages((prev) => ({
          ...prev,
          [chatroomId]: messages,
        }));
      }
    },
    [oneTimeRequest]
  );

  const sendChatMessage = useCallback(
    async (chatroomId: number, message: string, poll: ChatMessagePollData) => {
      const response = await oneTimeRequest(
        ChatroomSocketRequests.SendChatMessage,
        {
          chatroomId,
          message,
          poll,
        }
      );

      if (response.error) {
        // TODO
      } else {
        fetchChatroomMessages(chatroomId);
      }
    },
    [oneTimeRequest, fetchChatroomMessages]
  );

  const voteInPoll = useCallback(
    async (messageId: number, pollResponse: string) => {
      const response = await oneTimeRequest(ChatroomSocketRequests.VoteInPoll, {
        messageId,
        response: pollResponse,
      });

      if (response.error) {
        // TODO
      } else {
        const { chatroomId } = response.data as {
          chatroomId: number;
        };

        fetchChatroomMessages(chatroomId);
      }
    },
    [oneTimeRequest, fetchChatroomMessages]
  );

  const value = useMemo(
    () => ({
      data: {
        chatrooms,
        chatroomMessages,
        users: [],
      },
      requests: {
        fetchChatrooms,
        fetchChatroomMessages,
        sendChatMessage,
        voteInPoll,
      },
    }),
    [
      chatrooms,
      chatroomMessages,
      fetchChatrooms,
      fetchChatroomMessages,
      sendChatMessage,
      voteInPoll,
    ]
  );

  useEffect(() => {
    if (initialized && !initiallyFetched.current) {
      initiallyFetched.current = true;
      fetchChatrooms();
    }
  });

  return (
    <ChatroomContext.Provider value={value}>
      {children}
    </ChatroomContext.Provider>
  );
}

export function useChatrooms() {
  return useContext(ChatroomContext);
}
