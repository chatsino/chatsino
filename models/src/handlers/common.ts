import { PUBLISHER } from "cache";

export type HandlerResponse = {
  error?: boolean;
  message: string;
  data: Record<string, unknown>;
};

export enum CommonHandlerRequests {
  Response = "response",
  Event = "event",
}

export const handleRequest = (
  socketId: string,
  kind: string,
  args: Record<string, unknown> = {}
) => {
  return PUBLISHER.publish(
    kind,
    JSON.stringify({
      socketId,
      kind,
      args,
    })
  );
};

export const parseRequest = (message: string) =>
  JSON.parse(message) as {
    socketId: string;
    userId: string;
    kind: string;
    args: Record<string, unknown>;
  };

export const respondTo = (
  socketId: string,
  kind: string,
  result: HandlerResponse
) =>
  PUBLISHER.publish(
    CommonHandlerRequests.Response,
    JSON.stringify({ socketId, kind, result })
  );

export const publishEvent = (kind: string, data: HandlerResponse["data"]) =>
  PUBLISHER.publish(
    CommonHandlerRequests.Event,
    JSON.stringify({ kind, data })
  );
