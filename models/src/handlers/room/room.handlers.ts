import { PUBLISHER, SUBSCRIBER } from "cache";
import { PermissionMarker, RoomEntity } from "entities";
import { parseRequest, publishEvent, respondTo } from "../common";
import { RoomEvents } from "./room.events";
import { RoomRequests } from "./room.requests";
import { roomValidators } from "./room.validators";

export const initializeRoomHandlers = () => {
  // Queries
  SUBSCRIBER.subscribe(RoomRequests.Room, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId } = await roomValidators[RoomRequests.Room].validate(args);
      const room = await RoomEntity.queries.room(roomId);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got room.",
        data: {
          room: room.fields,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.AllRooms, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all rooms.",
        data: {
          rooms: await RoomEntity.queries.allRooms(),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all rooms.",
        data: {
          rooms: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.AllPublicRooms, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all public rooms.",
        data: {
          rooms: await RoomEntity.queries.allPublicRooms(),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all public rooms.",
        data: {
          rooms: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.TotalRooms, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got room total.",
        data: {
          total: await RoomEntity.queries.totalRooms(),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get room total.",
        data: {
          total: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.RoomByID, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId } = await roomValidators[RoomRequests.RoomByID].validate(
        args
      );
      const room = await RoomEntity.queries.roomById(roomId);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.RoomByRoomTitle, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { title } = await roomValidators[
        RoomRequests.RoomByRoomTitle
      ].validate(args);
      const room = await RoomEntity.queries.roomByRoomTitle(title);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got room by title.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get room by title.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(
    RoomRequests.MeetsRoomPermissionRequirement,
    async (message) => {
      const { socketId, kind, args } = parseRequest(message);

      try {
        const { roomId, userId, requirement } = await roomValidators[
          RoomRequests.MeetsRoomPermissionRequirement
        ].validate(args);

        return respondTo(socketId, kind, {
          error: false,
          message: "Successfully got user permission requirement.",
          data: {
            meetsRequirement:
              await RoomEntity.queries.meetsRoomPermissionRequirement(
                roomId,
                userId,
                requirement as PermissionMarker
              ),
          },
        });
      } catch (error) {
        return respondTo(socketId, kind, {
          error: true,
          message: "Unable to get user permission requirement.",
          data: {
            meetsRequirement: false,
          },
        });
      }
    }
  );
  SUBSCRIBER.subscribe(RoomRequests.RoomUsers, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId } = await roomValidators[RoomRequests.RoomUsers].validate(
        args
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got room users.",
        data: {
          users: (await RoomEntity.queries.roomUsers(roomId)).map(
            (user) => user.fields
          ),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get room users.",
        data: {
          users: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.RoomMessages, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId } = await roomValidators[
        RoomRequests.RoomMessages
      ].validate(args);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got room messages.",
        data: {
          messages: (await RoomEntity.queries.roomMessages(roomId)).map(
            (message) => message.fields
          ),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get room messages.",
        data: {
          messages: [],
        },
      });
    }
  });
  // Mutations
  SUBSCRIBER.subscribe(RoomRequests.CreateRoom, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const roomCreate = await roomValidators[RoomRequests.CreateRoom].validate(
        args
      );
      const room = await RoomEntity.mutations.createRoom(roomCreate);

      await publishEvent(RoomEvents.RoomCreated, { room });

      await PUBLISHER.publish(
        RoomEvents.RoomCreated,
        JSON.stringify({
          room,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully created a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: `Unable to create a room: ${error.message}`,
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.UpdateRoom, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, avatar, title, description, password } =
        await roomValidators[RoomRequests.UpdateRoom].validate(args);
      const room = await RoomEntity.mutations.updateRoom(roomId, {
        avatar,
        title,
        description,
        password,
      });

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully updated a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to update a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.JoinRoom, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, userId, password } = await roomValidators[
        RoomRequests.JoinRoom
      ].validate(args);
      const room = await RoomEntity.mutations.joinRoom(
        roomId,
        userId,
        password
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully joined a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to join a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.LeaveRoom, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, userId } = await roomValidators[
        RoomRequests.LeaveRoom
      ].validate(args);
      const room = await RoomEntity.mutations.leaveRoom(roomId, userId);

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully left a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to leave a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.ToggleCoOwner, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, modifyingUserId, modifiedUserId } = await roomValidators[
        RoomRequests.ToggleCoOwner
      ].validate(args);
      const room = await RoomEntity.mutations.toggleCoOwner(
        roomId,
        modifyingUserId,
        modifiedUserId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully toggled co-owner permissions for a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to toggle co-owner permissions for a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.ToggleBlacklisted, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, modifyingUserId, modifiedUserId } = await roomValidators[
        RoomRequests.ToggleBlacklisted
      ].validate(args);
      const room = await RoomEntity.mutations.toggleBlacklisted(
        roomId,
        modifyingUserId,
        modifiedUserId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully toggled blacklist permissions for a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to toggle blacklist permissions for a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.ToggleWhitelisted, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, modifyingUserId, modifiedUserId } = await roomValidators[
        RoomRequests.ToggleWhitelisted
      ].validate(args);
      const room = await RoomEntity.mutations.toggleWhitelisted(
        roomId,
        modifyingUserId,
        modifiedUserId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully toggled whitelist permissions for a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to toggle whitelist permissions for a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.ToggleMuted, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, modifyingUserId, modifiedUserId } = await roomValidators[
        RoomRequests.ToggleMuted
      ].validate(args);
      const room = await RoomEntity.mutations.toggleMuted(
        roomId,
        modifyingUserId,
        modifiedUserId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully toggled mute permissions for a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to toggle mute permissions for a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.SendMessage, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, userId, content, password } = await roomValidators[
        RoomRequests.SendMessage
      ].validate(args);
      const room = await RoomEntity.mutations.sendMessage(
        roomId,
        userId,
        content,
        password
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully sent a message a room.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to send a message to a room.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.SendDirectMessage, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { sendingUserId, receivingUserId, content } = await roomValidators[
        RoomRequests.SendDirectMessage
      ].validate(args);
      const { room, alreadyExisted } =
        await RoomEntity.mutations.sendDirectMessage(
          sendingUserId,
          receivingUserId,
          content
        );

      await PUBLISHER.publish(
        alreadyExisted ? RoomEvents.RoomChanged : RoomEvents.RoomCreated,
        JSON.stringify({
          room,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully sent a direct message.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to send a direct message.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.PinMessage, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, userId, messageId } = await roomValidators[
        RoomRequests.PinMessage
      ].validate(args);
      const room = await RoomEntity.mutations.pinMessage(
        roomId,
        userId,
        messageId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully pinned a message.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to pin a message.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.RemoveMessage, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, userId, messageId } = await roomValidators[
        RoomRequests.RemoveMessage
      ].validate(args);
      const room = await RoomEntity.mutations.removeMessage(
        roomId,
        userId,
        messageId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully removed a message.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to remove a message.",
        data: {
          room: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(RoomRequests.RemoveUserMessages, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { roomId, userId } = await roomValidators[
        RoomRequests.RemoveUserMessages
      ].validate(args);
      const room = await RoomEntity.mutations.removeUserMessages(
        roomId,
        userId
      );

      await publishEvent(RoomEvents.RoomChanged, { room });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully removed a user's messages.",
        data: {
          room: room ? room.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to remove a user's messages.",
        data: {
          room: null,
        },
      });
    }
  });
};
