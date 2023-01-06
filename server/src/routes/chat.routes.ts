import * as config from "config";
import { Request, Response, Router } from "express";
import { stat, unlink } from "fs/promises";
import { createLogger, errorResponse, successResponse } from "helpers";
import { requiredRoleMiddleware } from "middleware";
import {
  makeRequest,
  Message,
  MessageSocketRequests,
  messageValidators,
  Room,
  RoomPermission,
  RoomSocketRequests,
  roomValidators,
} from "models";
import path from "path";
import uuid from "uuid4";

export const CHAT_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.CHAT_ROUTER);

// Router
export function createChatRouter() {
  const chatRouter = Router();

  chatRouter.get("/rooms", getRoomsRoute);
  chatRouter.get("/rooms/:roomId", getRoomRoute);
  chatRouter.post(
    "/rooms/:roomId/avatar",
    requiredRoleMiddleware("user"),
    changeRoomAvatarRoute
  );
  chatRouter.post(
    "/rooms/:roomId/messages",
    requiredRoleMiddleware("user"),
    sendChatMessageRoute
  );
  chatRouter.patch(
    "/rooms/:roomId/messages/:messageId",
    requiredRoleMiddleware("user"),
    editChatMessageRoute
  );
  chatRouter.delete(
    "/rooms/:roomId/messages/:messageId",
    requiredRoleMiddleware("user"),
    deleteChatMessageRoute
  );
  chatRouter.post(
    "/rooms/:roomId/messages/:messageId/reactions",
    requiredRoleMiddleware("user"),
    reactToChatMessageRoute
  );
  chatRouter.post(
    "/rooms/:roomId/messages/:messageId/pin",
    requiredRoleMiddleware("user"),
    pinChatMessageRoute
  );
  chatRouter.post(
    "/rooms/:roomId/messages/:messageId/vote",
    requiredRoleMiddleware("user"),
    voteInPollRoute
  );

  return chatRouter;
}

// Routes
export async function getRoomsRoute(req: Request, res: Response) {
  try {
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { rooms } = (await makeRequest(
      userId,
      RoomSocketRequests.AllPublicRooms
    )) as {
      rooms: Room[];
    };

    return successResponse(res, "Room list retrieved.", {
      rooms,
    });
  } catch (error) {
    return errorResponse(res, "Unable to retrieve rooms.");
  }
}

export async function getRoomRoute(req: Request, res: Response) {
  try {
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { room } = (await makeRequest(userId, RoomSocketRequests.Room)) as {
      room: Room;
    };

    return successResponse(res, "Room retrieved.", {
      room,
    });
  } catch (error) {
    return errorResponse(res, "Unable to retrieve room.");
  }
}

export async function changeRoomAvatarRoute(req: Request, res: Response) {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return errorResponse(res, "Parameter `roomId` is required.");
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return errorResponse(res, "No files were uploaded.");
    }

    const { avatar } = req.files;

    if (avatar instanceof Array) {
      return errorResponse(res, "Only one avatar may be uploaded.");
    }

    // Ensure the user is actually allowed to change the avatar.
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { meetsRequirement } = (await makeRequest(
      userId,
      RoomSocketRequests.MeetsRoomPermissionRequirement,
      {
        roomId,
        userId,
        requirement: RoomPermission.CoOwner,
      }
    )) as {
      meetsRequirement: boolean;
    };

    if (!meetsRequirement) {
      return errorResponse(res, "User does not have permission to do that.");
    }

    // Reference the current avatar for later.
    const { room } = (await makeRequest(userId, RoomSocketRequests.Room, {
      roomId,
    })) as {
      room: Room;
    };
    const previousFilePath = room.avatar;

    // Change the avatar in the database.
    const { room: updatedRoom } = (await makeRequest(
      userId,
      RoomSocketRequests.UpdateRoom,
      {
        roomId,
        avatar,
      }
    )) as {
      room: Room;
    };

    if (!updatedRoom) {
      throw new Error("Room was not returned.");
    }

    // Move the new avatar to /uploads
    await new Promise((resolve, reject) =>
      avatar.mv(uploadPath, (err: unknown) =>
        err ? reject(err) : resolve(undefined)
      )
    );

    // Remove the previous avatar from storage.
    const previousUploadPath = path.join(
      config.FILE_UPLOAD_DIRECTORY,
      path.basename(previousFilePath)
    );

    let previousAvatarExists = false;

    try {
      await stat(previousUploadPath);
      previousAvatarExists = true;
    } catch {}

    if (previousAvatarExists) {
      await unlink(previousUploadPath);
    }

    // Determine the new file's URL.
    const resource = uuid() + path.extname(avatar.name);
    const uploadPath = path.join(config.FILE_UPLOAD_DIRECTORY, resource);
    const filePath = [config.FILE_UPLOAD_URL, resource].join("/");

    return successResponse(res, "Successfully changed room's avatar.", {
      room: updatedRoom,
      url: filePath,
    });
  } catch (error) {
    CHAT_ROUTER_LOGGER.error({ error }, "Failed to change room's avatar.");

    return errorResponse(res, "Unable to change room's avatar.");
  }
}

export async function sendChatMessageRoute(req: Request, res: Response) {
  try {
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { roomId, content, password } = await roomValidators[
      RoomSocketRequests.SendMessage
    ].validate(req.body);
    const { room } = (await makeRequest(
      userId,
      RoomSocketRequests.SendMessage,
      {
        roomId,
        userId,
        content,
        password,
      }
    )) as {
      room: Room;
    };

    return successResponse(res, "Successfully sent chat message.", {
      room,
    });
  } catch (error) {
    return errorResponse(res, "Unable to send chat message.");
  }
}

export async function editChatMessageRoute(req: Request, res: Response) {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const { userId = "(anonymous)" } = req.session as UserSession;
    const { content } = await messageValidators[
      MessageSocketRequests.EditMessage
    ].validate(req.body);
    const { message } = (await makeRequest(
      userId,
      MessageSocketRequests.EditMessage,
      {
        messageId,
        userId,
        content,
      }
    )) as {
      message: Message;
    };

    return successResponse(res, "Successfully edited chat message.", {
      message,
    });
  } catch (error) {
    return errorResponse(res, "Unable to edit chat message.");
  }
}

export async function reactToChatMessageRoute(req: Request, res: Response) {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const { userId = "(anonymous)" } = req.session as UserSession;
    const { reaction } = await messageValidators[
      MessageSocketRequests.ReactToMessage
    ].validate(req.body);
    const { message } = (await makeRequest(
      userId,
      MessageSocketRequests.ReactToMessage,
      {
        messageId,
        userId,
        reaction,
      }
    )) as {
      message: Message;
    };

    return successResponse(res, "Successfully reacted to chat message.", {
      message,
    });
  } catch (error) {
    return errorResponse(res, "Unable to react to chat message.");
  }
}

export async function pinChatMessageRoute(req: Request, res: Response) {
  try {
    const { messageId, roomId } = req.params;

    if (!roomId) {
      return errorResponse(res, "Parameter `roomId` is required.");
    }

    if (!messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const { userId = "(anonymous)" } = req.session as UserSession;
    const { room } = (await makeRequest(userId, RoomSocketRequests.PinMessage, {
      roomId,
      userId,
      messageId,
    })) as {
      room: Room;
    };

    return successResponse(res, `Successfully pinned a chat message.`, {
      room,
    });
  } catch (error) {
    return errorResponse(res, "Unable to pin a chat message.");
  }
}

export async function voteInPollRoute(req: Request, res: Response) {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const { userId = "(anonymous)" } = req.session as UserSession;
    const { option } = await messageValidators[
      MessageSocketRequests.VoteInMessagePoll
    ].validate(req.body);
    const { message } = (await makeRequest(
      userId,
      MessageSocketRequests.VoteInMessagePoll,
      {
        messageId,
        userId,
        option,
      }
    )) as {
      message: Message;
    };

    return successResponse(res, `Successfully voted in a poll.`, {
      message,
    });
  } catch (error) {
    return errorResponse(res, "Unable to vote in poll.");
  }
}

export async function deleteChatMessageRoute(req: Request, res: Response) {
  try {
    const { roomId, messageId } = req.params;

    if (!roomId) {
      return errorResponse(res, "Parameter `roomId` is required.");
    }

    if (!messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const { userId = "(anonymous)" } = req.session as UserSession;
    const { room } = (await makeRequest(
      userId,
      RoomSocketRequests.RemoveMessage,
      {
        roomId,
        userId,
        messageId,
      }
    )) as {
      room: Room;
    };

    return successResponse(res, "Successfully deleted chat message.", {
      room,
    });
  } catch (error) {
    CHAT_ROUTER_LOGGER.error({ error }, "Failed to delete chat message.");

    return errorResponse(res, "Unable to delete chat message.");
  }
}
