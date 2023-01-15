import { MessageSocketEvents, RoomSocketEvents } from "enums";
import { useSocket } from "hooks";
import { RoomLoaderData } from "loaders";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import uuid from "uuid4";

export function useUpdatingRoom() {
  const identifier = useRef(uuid());
  const { room: initialRoom } = useLoaderData() as RoomLoaderData;
  const { subscribe, unsubscribe } = useSocket();
  const [room, setRoom] = useState(initialRoom);

  // Updating room.
  useEffect(() => {
    const relevantIdentifier = identifier.current;

    subscribe(relevantIdentifier, RoomSocketEvents.RoomChanged, (response) =>
      setRoom(response.room as ChatsinoRoom)
    );

    subscribe(
      relevantIdentifier,
      MessageSocketEvents.MessageCreated,
      (response) => {
        const message = response.message as ChatsinoMessage;

        if (message.roomId === room.id) {
          setRoom((prev) => ({
            ...prev,
            messages: prev.messages.concat(message),
          }));
        }
      }
    );

    subscribe(
      relevantIdentifier,
      MessageSocketEvents.MessageChanged,
      (response) => {
        const message = response.message as ChatsinoMessage;

        if (message.roomId === room.id) {
          setRoom((prev) => ({
            ...prev,
            messages: prev.messages.map((each) => {
              const eachId = typeof each === "string" ? each : each.id;
              return eachId === message.id ? message : each;
            }),
          }));
        }
      }
    );

    subscribe(
      relevantIdentifier,
      MessageSocketEvents.MessageDeleted,
      (response) => {
        const message = response.message as ChatsinoMessage;

        if (message.roomId === room.id) {
          setRoom((prev) => ({
            ...prev,
            messages: prev.messages.filter((each) => {
              const eachId = typeof each === "string" ? each : each.id;
              return eachId !== message.id;
            }),
          }));
        }
      }
    );

    return () => {
      unsubscribe(relevantIdentifier, RoomSocketEvents.RoomChanged);
      unsubscribe(relevantIdentifier, MessageSocketEvents.MessageCreated);
      unsubscribe(relevantIdentifier, MessageSocketEvents.MessageChanged);
      unsubscribe(relevantIdentifier, MessageSocketEvents.MessageDeleted);
    };
  }, [subscribe, unsubscribe, room.id]);

  return room;
}
