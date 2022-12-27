export type MessageCreate = {
  roomId: string;
  userId: string;
  content: string;
  mentions?: string[];
};

export type MessageReaction = {
  reaction: string;
  users: string[];
};

export type MessagePollOption = {
  option: string;
  votes: string[];
};

export class MessageForbiddenEditError extends Error {
  statusCode = 403;
  message = "User does not have permission to edit that message.";
}

export class MessageForbiddenDeleteError extends Error {
  statusCode = 403;
  message = "User does not have permission to edit that message.";
}

export class MessageNotFoundError extends Error {
  statusCode = 404;
  message = "That message does not exist.";
}

export class MessageContentConflict extends Error {
  statusCode = 409;
  message = "That message was recently sent.";
}
