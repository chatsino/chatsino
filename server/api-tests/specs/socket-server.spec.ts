import { WebSocket } from "ws";
import { openSocket, sleep, waitForSocketState } from "../utils";

describe("Socket Server", () => {
  let socket: WebSocket;
  let responseString = "";

  beforeEach(async () => {
    socket = await openSocket();
    responseString = "";
  });

  afterEach(() => {
    if (socket.readyState === socket.OPEN) {
      socket.close();
    }
  });

  it("should connect", () => {
    expect(socket).toBeDefined();
  });

  it("should be able to subscribe", async () => {
    socket.send(
      JSON.stringify({
        kind: "client-subscribed",
        args: {
          subscription: "/foo/bar/baz",
        },
      })
    );

    socket.onmessage = (event) => {
      expect(event).toBeDefined();
      responseString = event.data as string;
      socket.close();
    };

    await waitForSocketState(socket, socket.CLOSED);

    const response = JSON.parse(responseString) as {
      kind: string;
      data: { message: string };
    };

    expect(response.kind).toBe("client-subscribed");
    expect(response.data.message.includes("is subscribed to")).toBeTruthy();
  });

  it.skip("should be able to unsubscribe", () => {});
});
