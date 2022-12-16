import {
  canClientMessageChatroom,
  ChatMessage,
  Chatroom,
  clientVotedInPoll,
  createChatMessage,
  readChatroomList,
  getClientById,
  readChatMessage,
  readChatMessageList,
  SUBSCRIBER,
} from "persistence";
import {
  listChatroomMessagesSchema,
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
}

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
    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to send message."
    );
  }
}

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

export async function handleVoteInPoll(messageString: string) {
  const { kind, args, from } = JSON.parse(
    messageString
  ) as SourcedSocketMessage;

  try {
    const { messageId, response } = await voteInPollSchema.validate(args);
    const message = (await readChatMessage(messageId)) as ChatMessage;
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
//
