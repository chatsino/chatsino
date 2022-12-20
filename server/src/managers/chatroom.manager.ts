import * as config from "config";
import {
  parseSourcedSocketMessage,
  PreparsedSourcedSocketMessage,
} from "helpers";
import { createLogger } from "logger";
import {
  canClientMessageChatroom,
  Chatroom,
  clientVotedInPoll,
  createChatMessage,
  getClientById,
  readChatMessage,
  readChatMessageList,
  readChatroomList,
} from "models";
import { CHATROOM_SUBSCRIPTIONS, SUBSCRIBER } from "persistence";
import {
  chatMessageDeletedSchema,
  chatMessageUpdatedSchema,
  chatroomUpdatedSchema,
  listChatroomMessagesSchema,
  newChatMessageSchema,
  sendChatMessageSchema,
  SourcedSocketMessage,
  voteInPollSchema,
} from "schemas";
import { SocketServer } from "socket-server";

export enum ChatroomSocketRequests {
  SendChatMessage = "send-chat-message",
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",
  VoteInPoll = "vote-in-poll",
  NewChatMessage = "new-chat-message",
  ChatMessageUpdated = "chat-message-updated",
  ChatMessageDeleted = "chat-message-deleted",
  ChatroomUpdated = "chatroom-updated",
}

export const CHATROOM_MANAGER_LOGGER = createLogger(
  config.LOGGER_NAMES.CHATROOM_MANAGER
);

export function initializeChatroomManager() {
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.SendChatMessage,
    handleSendChatMessage
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ListChatrooms,
    handleListChatrooms
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ListChatroomMessages,
    handleListChatroomMessages
  );
  SUBSCRIBER.subscribe(ChatroomSocketRequests.VoteInPoll, handleVoteInPoll);
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.NewChatMessage,
    handleNewChatMessage
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ChatMessageUpdated,
    handleChatMessageUpdated
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ChatMessageDeleted,
    handleChatMessageDeleted
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ChatroomUpdated,
    handleChatroomUpdated
  );
}

// #region Chatrooms
export async function handleListChatrooms(messageString: string) {
  const { kind, from } = JSON.parse(messageString) as SourcedSocketMessage;

  try {
    const chatrooms = (await readChatroomList()) as unknown as Chatroom[];
    const chatroomsWithData = await Promise.all(
      chatrooms?.map(async (chatroom) => {
        return {
          ...chatroom,
          createdBy: await getClientById(chatroom.createdBy),
          updatedBy: await getClientById(chatroom.updatedBy),
          users: [],
          messages: [],
        };
      })
    );

    return SocketServer.success(from.id, kind, {
      chatrooms: chatroomsWithData,
    });
  } catch (error) {
    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to list chatrooms."
    );
  }
}

export async function handleListChatroomMessages(messageString: string) {
  const { kind, args, from } = JSON.parse(
    messageString
  ) as SourcedSocketMessage;

  try {
    const { chatroomId } = await listChatroomMessagesSchema.validate(args);
    const messages = await readChatMessageList(chatroomId);

    if (!messages) {
      throw new Error();
    }

    return SocketServer.success(from.id, kind, {
      messages,
    });
  } catch (error) {
    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to list chatroom messages."
    );
  }
}

export async function handleChatroomUpdated(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { chatroom } = await chatroomUpdatedSchema.validate(args);

    await SocketServer.broadcastToSubscription(
      CHATROOM_SUBSCRIPTIONS.chatroomUpdated(chatroom.id),
      {
        chatroom,
      }
    );

    return SocketServer.success(from.id, kind, {
      message: `Alerted clients in Chatroom#${chatroom.id} that the chatroom was updated.`,
    });
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle updated chatroom."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      `Failed to alert clients to an updated chatroom.`
    );
  }
}
// #endregion

// #region Chat Messages
export async function handleSendChatMessage(messageString: string) {
  const { kind, args, from } = JSON.parse(
    messageString
  ) as SourcedSocketMessage;

  try {
    const { chatroomId, message, poll } = await sendChatMessageSchema.validate(
      args
    );
    const { can, reason } = await canClientMessageChatroom(from.id, chatroomId);

    if (!can) {
      throw new CannotMessageChatroomError(reason);
    }

    const chatMessage = await createChatMessage(
      from.id,
      chatroomId,
      message,
      poll
    );

    if (!chatMessage) {
      throw new SendChatMessageFailedError();
    }

    return SocketServer.success(from.id, kind, chatMessage);
  } catch (error) {
    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to send message."
    );
  }
}

export async function handleNewChatMessage(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { message } = await newChatMessageSchema.validate(args);

    await SocketServer.broadcastToSubscription(
      CHATROOM_SUBSCRIPTIONS.newChatMessage(message.chatroomId),
      {
        message,
      }
    );

    return SocketServer.success(from.id, kind, {
      message: `Alerted clients in Chatroom#${message.chatroomId} to a new message.`,
    });
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle new chat message."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      `Failed to alert clients to a new message.`
    );
  }
}

export async function handleChatMessageUpdated(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { message } = await chatMessageUpdatedSchema.validate(args);

    await SocketServer.broadcastToSubscription(
      CHATROOM_SUBSCRIPTIONS.chatMessageUpdated(message.chatroomId),
      {
        message,
      }
    );

    return SocketServer.success(from.id, kind, {
      message: `Alerted clients in Chatroom#${message.chatroomId} to an updated message.`,
    });
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle updated chat message."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      `Failed to alert clients to an updated message.`
    );
  }
}

export async function handleChatMessageDeleted(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { chatroomId, messageId } = await chatMessageDeletedSchema.validate(
      args
    );

    await SocketServer.broadcastToSubscription(
      CHATROOM_SUBSCRIPTIONS.chatMessageDeleted(chatroomId),
      {
        messageId,
      }
    );

    return SocketServer.success(from.id, kind, {
      message: `Alerted clients in Chatroom#${chatroomId} to a deleted message.`,
    });
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle deleted chat message."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      `Failed to alert clients to a deleted message.`
    );
  }
}

export async function handleVoteInPoll(messageString: string) {
  const { kind, args, from } = JSON.parse(
    messageString
  ) as SourcedSocketMessage;

  try {
    const { messageId, response } = await voteInPollSchema.validate(args);
    const messageData = await readChatMessage(messageId);

    if (!messageData) {
      throw new Error();
    }

    const { message } = messageData;

    const { can, reason } = await canClientMessageChatroom(
      from.id,
      message.chatroomId
    );

    if (!can) {
      throw new CannotVoteInPollError(reason);
    }

    const successfullyVoted = await clientVotedInPoll(
      from.id,
      messageId,
      response
    );

    if (!successfullyVoted) {
      throw new CannotVoteInPollError();
    }

    return SocketServer.success(from.id, kind, {
      success: successfullyVoted,
      chatroomId: message.chatroomId,
    });
  } catch (error) {
    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to vote in poll."
    );
  }
}
// #endregion

export function handleChatroomErrors(
  to: number,
  kind: string,
  error: unknown,
  fallback: string
) {
  const sendError = (message: string) => SocketServer.error(to, kind, message);

  if (error instanceof CannotMessageChatroomError) {
    return sendError(error.message);
  }

  if (error instanceof CannotVoteInPollError) {
    return sendError(error.message);
  }

  if (error instanceof Error) {
    return sendError(fallback);
  }
}

export class CannotMessageChatroomError extends Error {}
export class CannotVoteInPollError extends Error {}
export class SendChatMessageFailedError extends Error {}
