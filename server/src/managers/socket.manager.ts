import { publisher, subscriber } from "persistence";
import {
  socketSuccessResponseSchema,
  socketErrorResponseSchema,
  sourcedSocketMessageSchema,
  SourcedSocketMessage,
} from "schemas";
import { CLIENT_MESSAGE_CHANNEL, sendMessage } from "sockets";

export enum SocketMessages {
  SuccessResponse = "success-response",
  ErrorResponse = "error-response",
}

export function initializeSocketManager() {
  subscriber.subscribe(CLIENT_MESSAGE_CHANNEL, routeSocketRequest);
  subscriber.subscribe(
    SocketMessages.SuccessResponse,
    sendSuccessSocketMessage
  );
  subscriber.subscribe(SocketMessages.ErrorResponse, sendErrorSocketMessage);
}

export async function routeSocketRequest(messageString: string) {
  const message = (await sourcedSocketMessageSchema.validate(
    JSON.parse(messageString)
  )) as SourcedSocketMessage;

  publisher.publish(message.kind, JSON.stringify(message));
}

export async function sendSuccessSocketMessage(messageString: string) {
  const { to, kind, data } = await socketSuccessResponseSchema.validate(
    JSON.parse(messageString)
  );

  return sendMessage(to, {
    kind,
    data,
  });
}

export async function sendErrorSocketMessage(messageString: string) {
  const { to, kind, error } = await socketErrorResponseSchema.validate(
    JSON.parse(messageString)
  );

  return sendMessage(to, {
    kind,
    error,
  });
}
