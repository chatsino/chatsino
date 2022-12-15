import { WebSocket } from "ws";
import { openSocket, subscribeTo, waitForSocketState } from "../utils";

describe("Socket Server", () => {
  let socket: WebSocket;
  let responseString = "";
  const sampleSubscription = "/foo/bar/baz";

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
    subscribeTo(socket, sampleSubscription);

    socket.onmessage = (event) => {
      expect(event).toBeDefined();
      responseString = event.data as string;
      socket.close();
    };

    await waitForSocketState(socket, socket.CLOSED);

    const response = JSON.parse(responseString) as {
      kind: string;
      data: { message: string };
      error: string;
    };

    expect(response.kind).toBe("client-subscribed");
    expect(
      response.data.message.includes(`is subscribed to ${sampleSubscription}`)
    ).toBeTruthy();
  });

  it("should be able to unsubscribe", async () => {
    subscribeTo(socket, sampleSubscription);

    let done = false;

    socket.onmessage = () => {
      done = true;
    };

    await new Promise((resolve: any) =>
      setInterval(() => {
        if (done) {
          resolve();
        }
      }, 5)
    );

    socket.send(
      JSON.stringify({
        kind: "client-unsubscribed",
        args: {
          subscription: sampleSubscription,
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

    expect(response.kind).toBe("client-unsubscribed");
    expect(
      response.data.message.includes(
        `is no longer subscribed to ${sampleSubscription}`
      )
    ).toBeTruthy();
  });

  it("should prevent unsubscribing from a nonexistent subscription", async () => {
    const nonexistentSubscription = "/does/not/exist";

    socket.send(
      JSON.stringify({
        kind: "client-unsubscribed",
        args: {
          subscription: nonexistentSubscription,
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
      error: string;
    };

    expect(response.kind).toBe("client-unsubscribed");
    expect(response.error).toBe(
      `Subscription "${nonexistentSubscription}" does not exist.`
    );
  });
});
