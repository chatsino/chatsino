import { MessageSocketRequests, RoomSocketRequests } from "enums";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSocket } from "../useSocket";

export const RoomContext = createContext<{
  data: {
    rooms: ChatsinoRoom[];
    users: Array<string | ChatsinoUser>;
  };
  requests: {
    fetchRoom(roomId: string): Promise<void>;
    fetchRooms(): Promise<void>;
    sendMessageToRoom(
      roomId: string,
      content: string,
      poll?: null
    ): Promise<void>;
    voteInPoll(messageId: string, response: string): Promise<void>;
  };
}>({
  data: {
    rooms: [],
    users: [],
  },
  requests: {
    fetchRoom: Promise.resolve,
    fetchRooms: Promise.resolve,
    sendMessageToRoom: Promise.resolve,
    voteInPoll: Promise.resolve,
  },
});

export function RoomProvider({ children }: { children?: ReactNode }) {
  const { oneTimeRequest } = useSocket();
  const [rooms, setRooms] = useState([] as ChatsinoRoom[]);
  const fetchRooms = useCallback(async () => {
    const { error, ...data } = await oneTimeRequest(
      RoomSocketRequests.AllPublicRooms
    );

    if (error) {
      // TODO
    } else {
      setRooms(data.rooms as ChatsinoRoom[]);
    }
  }, [oneTimeRequest]);
  const fetchRoom = useCallback(
    async (roomId: string) => {
      const { error, ...data } = await oneTimeRequest(RoomSocketRequests.Room);

      if (error) {
        // TODO
      } else {
        setRooms((prev) => {
          const room = data.room as ChatsinoRoom;
          const existingRoomIndex = prev.findIndex(
            (each) => each.id === roomId
          );

          if (existingRoomIndex !== -1) {
            const before = prev.slice(0, existingRoomIndex);
            const after = prev.slice(existingRoomIndex + 1);

            return [...before, room, ...after];
          } else {
            return prev.concat(room);
          }
        });

        setRooms(data.rooms as ChatsinoRoom[]);
      }
    },
    [oneTimeRequest]
  );
  const sendMessageToRoom = useCallback(
    async (roomId: string, content: string, poll: null) => {
      const { error } = await oneTimeRequest(RoomSocketRequests.SendMessage, {
        roomId,
        content,
        poll,
      });

      if (error) {
        // TODO
      }
    },
    [oneTimeRequest]
  );
  const voteInPoll = useCallback(
    async (messageId: string, option: string) => {
      const { error } = await oneTimeRequest(
        MessageSocketRequests.VoteInMessagePoll,
        {
          messageId,
          option,
        }
      );

      if (error) {
        // TODO
      }
    },
    [oneTimeRequest]
  );

  const value = useMemo(
    () => ({
      data: {
        rooms,
        users: rooms
          .map((each) => each.users)
          .reduce(
            (prev, next) => prev.concat(next),
            [] as Array<string | ChatsinoUser>
          ),
      },
      requests: {
        fetchRooms,
        fetchRoom,
        sendMessageToRoom,
        voteInPoll,
      },
    }),
    [rooms, fetchRooms, fetchRoom, sendMessageToRoom, voteInPoll]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useChatrooms() {
  return useContext(RoomContext);
}
