import { WebSocket } from "ws";
import { getTicket, signup } from "./auth";
import { cert } from "./make-request";

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
    `wss://localhost/api?ticket=${await getTicket()}`,
    {
      cert,
    }
  );

  await waitForSocketState(socket, socket.OPEN);

  return socket;
}
