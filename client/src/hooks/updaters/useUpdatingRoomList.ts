import { RoomSocketEvents } from "enums";
import { useSocket } from "hooks";
import { RoomListLoaderData } from "loaders";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import uuid from "uuid4";

export function useUpdatingRoomList() {
  const identifier = useRef(uuid());
  const { rooms: initialRooms } = useLoaderData() as RoomListLoaderData;
  const { subscribe, unsubscribe } = useSocket();
  const [rooms, setRooms] = useState(initialRooms);

  useEffect(() => {
    const relevantIdentifier = identifier.current;

    subscribe(relevantIdentifier, RoomSocketEvents.RoomCreated, (response) =>
      setRooms((prev) => prev.concat(response.room as ChatsinoRoom))
    );

    subscribe(relevantIdentifier, RoomSocketEvents.RoomChanged, (response) =>
      setRooms((prev) => {
        const room = response.room as ChatsinoRoom;

        return prev.map((each) => (each.id === room.id ? room : each));
      })
    );

    return () => {
      unsubscribe(relevantIdentifier, RoomSocketEvents.RoomCreated);
      unsubscribe(relevantIdentifier, RoomSocketEvents.RoomChanged);
    };
  }, [subscribe, unsubscribe, rooms]);

  return {
    rooms,
  };
}
