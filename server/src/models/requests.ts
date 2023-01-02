import * as config from "config";
import { WebSocket } from "ws";
import { MessageSocketEvents, MessageSocketRequests } from "./message";
import { RoomSocketEvents, RoomSocketRequests } from "./room";
import { UserSocketEvents, UserSocketRequests } from "./user";

export type CombinedRequests =
  | UserSocketRequests
  | MessageSocketRequests
  | RoomSocketRequests;

export type CombinedEvents =
  | UserSocketEvents
  | MessageSocketEvents
  | RoomSocketEvents;

export type CombinedSubscriptions = CombinedRequests | CombinedEvents;

export function makeRequest(
  kind: CombinedRequests,
  args: Record<string, unknown> = {}
) {
  return new Promise<Record<string, unknown>>((resolve, reject) =>
    makeModelRequest({ kind, args }, { onSuccess: resolve, onError: reject })
  );
}

export async function makeModelRequest(
  request: {
    kind: CombinedRequests;
    args: Record<string, unknown>;
  },
  handlers: {
    onSuccess?(data: Record<string, unknown>): unknown;
    onError?(message: string): unknown;
  } = {},
  timeout = 2000
) {
  const modelSocket = new WebSocket(config.MODELS_CONNECTION_STRING);

  let wasSuccessful = false;

  const willTimeout = setTimeout(() => {
    if (!wasSuccessful) {
      handlers.onError?.("Request timed out.");
      return modelSocket.close();
    }
  }, timeout);

  modelSocket.on("open", () => {
    modelSocket.send(JSON.stringify(request));
  });
  modelSocket.on("error", () =>
    handlers.onError?.("An unknown error occurred.")
  );
  modelSocket.on("close", () => {
    if (!wasSuccessful) {
      handlers.onError?.(
        "The connection closed before finishing the request.."
      );
    }

    clearTimeout(willTimeout);
  });
  modelSocket.on("message", (socketMessage) => {
    try {
      const {
        kind,
        result: { error, message, data },
      } = JSON.parse(socketMessage.toString()) as {
        kind: CombinedRequests;
        result: {
          error: boolean;
          message: string;
          data: Record<string, unknown>;
        };
      };

      if (kind === request.kind) {
        if (error) {
          return handlers.onError?.(message);
        } else {
          wasSuccessful = true;
          handlers.onSuccess?.(data);
          return modelSocket.close();
        }
      }
    } catch (error) {
      return handlers.onError?.(
        "Failed to properly handle an incoming message."
      );
    }
  });

  return willTimeout;
}
