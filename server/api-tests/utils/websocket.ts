import { WebSocket } from "ws";
import { getTicket, signup } from "./auth";

export function waitForSocketState(
  socket: WebSocket,
  state: WebSocket["readyState"]
): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(function () {
      if (socket.readyState === state) {
        resolve();
      } else {
        waitForSocketState(socket, state).then(resolve);
      }
    }, 5);
  });
}

export async function openSocket() {
  await signup();

  const socket = new WebSocket(
    `wss://localhost/api?ticket=${await getTicket()}`
  );

  await waitForSocketState(socket, socket.OPEN);

  return socket;
}

export function sendSocketMessage(
  socket: WebSocket,
  kind: string,
  args: Record<string, unknown> = {}
) {
  return socket.send(
    JSON.stringify({
      kind,
      args,
    })
  );
}

export function subscribeTo(socket: WebSocket, subscription: string) {
  return sendSocketMessage(socket, "client-subscribed", {
    subscription,
  });
}
