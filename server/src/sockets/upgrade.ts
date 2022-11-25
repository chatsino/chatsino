import { validateTicket } from "auth";
import { Request } from "express";
import { Duplex } from "stream";
import { SOCKETS_LOGGER } from "./common";
import { createWebSocket } from "./controller";

export async function upgrade(request: Request, socket: Duplex, head: Buffer) {
  SOCKETS_LOGGER.info("A client is attempting to open a WebSocket connection.");

  SOCKETS_LOGGER.info("Validating ticket.");
  const client = await validateTicket(request);

  if (!client) {
    SOCKETS_LOGGER.info(
      "Unable to validate ticket: denying connection attempt."
    );
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return socket.destroy();
  }

  return createWebSocket(request, socket, head, client);
}
