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
  )
    .then((result) => {
      console.log("\n\n", result, "\n\n");
      return result;
    })
    .catch((err) => {
      console.log("\n\n", err, "\n\n");
    });
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
  timeout = 200000
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
      handlers.onError?.("The connection closed before finishing the request.");
    }

    clearTimeout(willTimeout);
  });
  modelSocket.on("message", (socketMessage) => {
    try {
      const foo = JSON.parse(socketMessage.toString()) as {
        kind: CombinedRequests;
        result: {
          error: boolean;
          message: string;
          data: Record<string, unknown>;
        };
      };

      if (foo.kind === request.kind) {
        if (foo.result.error) {
          return handlers.onError?.(foo.result.message);
        } else {
          wasSuccessful = true;
          handlers.onSuccess?.(foo.result.data);
          return modelSocket.close();
        }
      }
    } catch (error) {
      console.log("\n\n", error, "\n\n");

      return handlers.onError?.(
        "Failed to properly handle an incoming message."
      );
    }
  });

  return willTimeout;
}
