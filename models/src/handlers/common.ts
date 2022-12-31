import { PUBLISHER } from "cache";

export enum CommonHandlerRequests {
  Response = "response",
}

export const respondTo = <
  T extends { error: boolean; message: string; data: Record<string, unknown> }
>(
  socketId: string,
  kind: string,
  result: T
) => {
  return PUBLISHER.publish(
    CommonHandlerRequests.Response,
    JSON.stringify({ socketId, kind, result })
  );
};

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
