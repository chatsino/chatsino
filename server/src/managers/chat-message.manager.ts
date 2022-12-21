import * as config from "config";
import { ChatMessageSocketRequests } from "enums";
import {
  parseSourcedSocketMessage,
  PreparsedSourcedSocketMessage,
} from "helpers";
import { createLogger } from "logger";
import {
  canClientMessageChatroom,
  clientVotedInPoll,
  createChatMessage,
  readChatMessage,
  readChatMessageList,
} from "models";
import { SUBSCRIBER } from "persistence";
import {
  chatMessageDeletedSchema,
  chatMessageUpdatedSchema,
  listChatroomMessagesSchema,
  newChatMessageSchema,
  sendChatMessageSchema,
  SourcedSocketMessage,
  voteInPollSchema,
} from "schemas";
import { SocketServer } from "socket-server";
import { CHATROOM_SUBSCRIPTIONS } from "subscriptions";

export const CHAT_MESSAGE_MANAGER_LOGGER = createLogger(
  config.LOGGER_NAMES.CHAT_MESSAGE_MANAGER
);

export function initializeChatMessageManager() {
  SUBSCRIBER.subscribe(
    ChatMessageSocketRequests.ListChatroomMessages,
    handleListChatroomMessages
  );
  SUBSCRIBER.subscribe(
    ChatMessageSocketRequests.SendChatMessage,
    handleSendChatMessage
  );
  SUBSCRIBER.subscribe(
    ChatMessageSocketRequests.ListChatroomMessages,
    handleListChatroomMessages
  );
  SUBSCRIBER.subscribe(ChatMessageSocketRequests.VoteInPoll, handleVoteInPoll);
  SUBSCRIBER.subscribe(
    ChatMessageSocketRequests.NewChatMessage,
    handleNewChatMessage
  );
  SUBSCRIBER.subscribe(
    ChatMessageSocketRequests.ChatMessageUpdated,
    handleChatMessageUpdated
  );
  SUBSCRIBER.subscribe(
    ChatMessageSocketRequests.ChatMessageDeleted,
    handleChatMessageDeleted
  );
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
    return handleChatMessageErrors(
      from.id,
      kind,
      error,
      "Failed to list chatroom messages."
    );
  }
}

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
    return handleChatMessageErrors(
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
    CHAT_MESSAGE_MANAGER_LOGGER.error(
      { error },
      "Failed to handle new chat message."
    );

    return handleChatMessageErrors(
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
    CHAT_MESSAGE_MANAGER_LOGGER.error(
      { error },
      "Failed to handle updated chat message."
    );

    return handleChatMessageErrors(
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
    CHAT_MESSAGE_MANAGER_LOGGER.error(
      { error },
      "Failed to handle deleted chat message."
    );

    return handleChatMessageErrors(
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
    return handleChatMessageErrors(
      from.id,
      kind,
      error,
      "Failed to vote in poll."
    );
  }
}

export function handleChatMessageErrors(
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
