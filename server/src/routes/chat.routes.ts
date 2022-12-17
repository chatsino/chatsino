import * as config from "config";
import { Response, Router } from "express";
import {
  errorResponse,
  meetsPermissionRequirement,
  successResponse,
} from "helpers";
import { createLogger } from "logger";
import * as chatroomManager from "managers/chatroom.manager";
import { AuthenticatedRequest, authenticatedRouteMiddleware } from "middleware";
import {
  readChatMessageList,
  readChatroomList,
  canClientMessageChatroom,
  createChatMessage,
  editChatMessage,
  readChatMessage,
  reactToChatMessage,
  deleteChatMessage,
  pinChatMessage,
  clientVotedInPoll,
  readHydratedChatroom,
  safetifyChatroom,
  getClientById,
  HydratedChatMessage,
  Client,
} from "persistence";
import {
  editChatMessageSchema,
  reactToChatMessageSchema,
  sendChatMessageSchema,
  voteInPollSchema,
} from "schemas";

export const CHAT_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.CHAT_ROUTER);

export function createChatRouter() {
  const chatRouter = Router();

  chatRouter.get("/chatrooms", getChatroomListRoute);
  chatRouter.get("/chatrooms/:chatroomId", getChatroomRoute);
  chatRouter.post(
    "/chatrooms/:chatroomId/messages",
    authenticatedRouteMiddleware("user"),
    sendChatMessageRoute
  );
  chatRouter.patch(
    "/chatrooms/:chatroomId/messages/:messageId",
    authenticatedRouteMiddleware("user"),
    editChatMessageRoute
  );
  chatRouter.delete(
    "/chatrooms/:chatroomId/messages/:messageId",
    authenticatedRouteMiddleware("user"),
    deleteChatMessageRoute
  );
  chatRouter.post(
    "/chatrooms/:chatroomId/messages/:messageId/reactions",
    authenticatedRouteMiddleware("user"),
    reactToChatMessageRoute
  );
  chatRouter.post(
    "/chatrooms/:chatroomId/messages/:messageId/pin",
    authenticatedRouteMiddleware("admin:limited"),
    pinChatMessageRoute
  );
  chatRouter.post(
    "/chatrooms/:chatroomId/messages/:messageId/vote",
    authenticatedRouteMiddleware("user"),
    voteInPollRoute
  );

  return chatRouter;
}

export async function getChatroomListRoute(
  _: AuthenticatedRequest,
  res: Response
) {
  try {
    const chatroomsData = await readChatroomList();

    if (!chatroomsData) {
      throw new Error();
    }

    const { chatrooms, cached } = chatroomsData;

    return successResponse(res, "Chatroom list retrieved.", {
      chatrooms,
      cached,
    });
  } catch (error) {
    return errorResponse(res, "Unable to retrieve chatrooms.");
  }
}

export async function getChatroomRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.params.chatroomId) {
      return errorResponse(res, "Parameter `chatroomId` is required.");
    }

    const chatroomId = parseInt(req.params.chatroomId);
    const chatroomData = await readHydratedChatroom(chatroomId);

    if (!chatroomData) {
      return errorResponse(res, `Chatroom#${chatroomId} does not exist.`);
    }

    const { chatroom, cached: chatroomCached } = chatroomData;

    if (chatroom.password) {
      const { password } = req.query;

      if (!password || password !== chatroom.password) {
        return errorResponse(res, `Chatroom#${chatroomId} does not exist.`);
      }
    }

    const { messages, cached: messagesCached } = (await readChatMessageList(
      chatroomId
    )) ?? {
      messages: [],
    };
    const users = await Promise.resolve([]);

    return successResponse(res, "Chatroom retrieved.", {
      chatroom: safetifyChatroom(chatroom),
      messages,
      users,
      cached: {
        chatroom: chatroomCached,
        messages: messagesCached,
      },
    });
  } catch (error) {
    return errorResponse(res, "Unable to retrieve chatroom.");
  }
}

export async function sendChatMessageRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id: clientId } = req.chatsinoClient!;
    const { chatroomId, message, poll } = await sendChatMessageSchema.validate(
      req.body
    );
    const { can, reason } = await canClientMessageChatroom(
      req.chatsinoClient!.id,
      chatroomId
    );

    if (!can) {
      return errorResponse(res, reason);
    }

    const chatMessage = await createChatMessage(
      clientId,
      chatroomId,
      message,
      poll
    );

    if (!chatMessage) {
      throw new Error();
    }

    const author = await getClientById(clientId);

    if (!author) {
      throw new Error();
    }

    const hydratedChatMessage = {
      ...chatMessage,
      author: {
        id: author.id,
        avatar: author.avatar,
        username: author.username,
      },
    } as HydratedChatMessage;

    await chatroomManager.handleNewChatMessage({
      from: author,
      kind: chatroomManager.ChatroomSocketRequests.NewChatMessage,
      args: {
        message: hydratedChatMessage,
      },
    });

    return successResponse(res, "Successfully sent chat message.", {
      message: chatMessage,
    });
  } catch (error) {
    return errorResponse(res, "Unable to send chat message.");
  }
}

export async function editChatMessageRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.params.messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const messageId = parseInt(req.params.messageId);
    const { id: clientId } = req.chatsinoClient!;
    const { message } = await editChatMessageSchema.validate(req.body);
    const existingMessageData = await readChatMessage(messageId);
    const author = await getClientById(clientId);

    if (!existingMessageData || !author) {
      throw new Error();
    }

    const { message: existingMessage } = existingMessageData;

    if (existingMessage.clientId !== clientId) {
      return errorResponse(res, "You cannot edit someone else's message.");
    }

    const editedMessage = await editChatMessage(messageId, message);

    if (!editedMessage) {
      throw new Error();
    }

    await chatroomManager.handleChatMessageUpdated({
      from: author,
      kind: chatroomManager.ChatroomSocketRequests.ChatMessageUpdated,
      args: {
        message: editedMessage,
      },
    });

    return successResponse(res, "Successfully edited chat message.", {
      message: editedMessage,
    });
  } catch (error) {
    return errorResponse(res, "Unable to edit chat message.");
  }
}

export async function reactToChatMessageRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.params.messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const messageId = parseInt(req.params.messageId);
    const { id: clientId } = req.chatsinoClient!;
    const { reaction } = await reactToChatMessageSchema.validate(req.body);
    const existingMessageData = await readChatMessage(messageId);
    const author = await getClientById(clientId);

    if (!existingMessageData || !author) {
      throw new Error();
    }

    const { message: existingMessage } = existingMessageData;
    const { can, reason } = await canClientMessageChatroom(
      req.chatsinoClient!.id,
      existingMessage.chatroomId
    );

    if (!can) {
      return errorResponse(res, reason);
    }

    const message = await reactToChatMessage(messageId, clientId, reaction);

    if (!message) {
      throw new Error();
    }

    await chatroomManager.handleChatMessageUpdated({
      from: author,
      kind: chatroomManager.ChatroomSocketRequests.ChatMessageUpdated,
      args: {
        message,
      },
    });

    return successResponse(res, "Successfully reacted to chat message.", {
      message,
    });
  } catch (error) {
    return errorResponse(res, "Unable to react to chat message.");
  }
}

export async function pinChatMessageRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.params.messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const messageId = parseInt(req.params.messageId);
    const pinnedMessage = await pinChatMessage(messageId);
    const pinner = await getClientById(req.chatsinoClient!.id);

    if (!pinnedMessage || !pinner) {
      throw new Error();
    }

    await chatroomManager.handleChatMessageUpdated({
      from: pinner,
      kind: chatroomManager.ChatroomSocketRequests.ChatMessageUpdated,
      args: {
        message: pinnedMessage,
      },
    });

    return successResponse(
      res,
      `Successfully ${
        pinnedMessage.pinned ? "pinned" : "unpinned"
      } chat message.`,
      {
        message: pinnedMessage,
      }
    );
  } catch (error) {
    return errorResponse(res, "Unable to pin chat message.");
  }
}

export async function voteInPollRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.params.messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const messageId = parseInt(req.params.messageId);
    const { id: clientId } = req.chatsinoClient!;
    const { response } = await voteInPollSchema.validate({
      messageId,
      response: req.body.response,
    });
    const existingMessageData = await readChatMessage(messageId);
    const voter = await getClientById(req.chatsinoClient!.id);

    if (!existingMessageData || !voter) {
      throw new Error();
    }

    const { message: existingMessage } = existingMessageData;
    const { can, reason } = await canClientMessageChatroom(
      clientId,
      existingMessage.chatroomId
    );

    if (!can) {
      return errorResponse(res, reason);
    }

    const votedMessage = await clientVotedInPoll(clientId, messageId, response);

    if (!votedMessage) {
      throw new Error();
    }

    await chatroomManager.handleChatMessageUpdated({
      from: voter,
      kind: chatroomManager.ChatroomSocketRequests.ChatMessageUpdated,
      args: {
        message: votedMessage,
      },
    });

    return successResponse(res, "Successfully voted in poll.", {
      message: votedMessage,
    });
  } catch (error) {
    return errorResponse(res, "Unable to vote in poll.");
  }
}

export async function deleteChatMessageRoute(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.params.messageId) {
      return errorResponse(res, "Parameter `messageId` is required.");
    }

    const messageId = parseInt(req.params.messageId);
    const { id: clientId, permissionLevel } = req.chatsinoClient!;
    const existingMessageData = await readChatMessage(messageId);

    if (!existingMessageData) {
      throw new Error("Existing message data not found.");
    }

    const { message: existingMessage } = existingMessageData;

    if (
      existingMessage.clientId !== clientId &&
      !meetsPermissionRequirement("admin:limited", permissionLevel)
    ) {
      return errorResponse(
        res,
        "You do not have permission to delete that chat message."
      );
    }

    const deletedMessage = await deleteChatMessage(messageId);

    if (!deletedMessage) {
      throw new Error("Message not found post-deletion.");
    }

    await chatroomManager.handleChatMessageDeleted({
      from: (await getClientById(clientId)) as Client,
      kind: chatroomManager.ChatroomSocketRequests.ChatMessageDeleted,
      args: {
        chatroomId: deletedMessage.chatroomId,
        messageId: deletedMessage.id,
      },
    });

    return successResponse(res, "Successfully deleted chat message.", {
      message: deletedMessage,
    });
  } catch (error) {
    CHAT_ROUTER_LOGGER.error({ error }, "Failed to delete chat message.");

    return errorResponse(res, "Unable to delete chat message.");
  }
}
