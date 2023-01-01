import { PUBLISHER } from "persistence";

export type ManagerResponse = {
  error?: boolean;
  message: string;
  data: Record<string, unknown>;
};

export enum CommonManagerRequests {
  Response = "api-response",
  Event = "api-event",
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
  result: ManagerResponse
) =>
  PUBLISHER.publish(
    CommonManagerRequests.Response,
    JSON.stringify({ socketId, kind, result })
  );

export const publishEvent = (kind: string, data: ManagerResponse["data"]) =>
  PUBLISHER.publish(
    CommonManagerRequests.Event,
    JSON.stringify({ kind, data })
  );
