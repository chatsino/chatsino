import { WebSocket } from "ws";
import { openSocket, sendSocketMessage, waitForSocketState } from "../../utils";

const CHAT_MESSAGE_SCHEMA = {
  chatroomId: expect.any(Number),
  clientId: expect.any(Number),
  content: expect.any(String),
  createdAt: expect.any(String),
  id: expect.any(Number),
  pinned: expect.any(Boolean),
  poll: expect.any(Object),
  reactions: expect.any(Object),
  updatedAt: expect.any(String),
};

describe("Chatroom Manager", () => {
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

  it("should send a message to a chatroom", async () => {
    socket.onmessage = (event) => {
      expect(event).toBeDefined();
      responseString = event.data as string;
      socket.close();
    };

    sendSocketMessage(socket, "send-chat-message", {
      chatroomId: 1,
      message: "Hello",
    });

    await waitForSocketState(socket, socket.CLOSED);

    const response = JSON.parse(responseString) as {
      kind: string;
      data: { message: string };
      error: string;
    };

    expect(response.kind).toBe("send-chat-message");
    expect(response.data).toEqual(CHAT_MESSAGE_SCHEMA);
    expect(response.error).toBeUndefined();
  });

  it("should send a poll message to a chatroom", async () => {
    const poll = {
      question: "Do you like this functionality?",
      answers: [
        {
          text: "Yes",
          respondents: [],
        },
        {
          text: "No",
          respondents: [],
        },
      ],
    };

    socket.onmessage = (event) => {
      expect(event).toBeDefined();
      responseString = event.data as string;
      socket.close();
    };

    sendSocketMessage(socket, "send-chat-message", {
      chatroomId: 1,
      message: "This is my poll",
      poll,
    });

    await waitForSocketState(socket, socket.CLOSED);

    const response = JSON.parse(responseString) as {
      kind: string;
      data: {
        poll: {
          question: string;
          answers: Array<{ text: string; respondents: number[] }>;
        };
      };
      error: string;
    };

    expect(response.kind).toBe("send-chat-message");
    expect(response.data).toEqual(CHAT_MESSAGE_SCHEMA);
    expect(response.data.poll).toEqual(poll);
    expect(response.error).toBeUndefined();
  });

  it("should respond to a poll in a chatroom", async () => {
    const poll = {
      question: "Do you like this functionality?",
      answers: [
        {
          text: "Yes",
          respondents: [],
        },
        {
          text: "No",
          respondents: [],
        },
      ],
    };

    let requests = 0;

    socket.onmessage = (event) => {
      if (requests === 0) {
        const response = JSON.parse(event.data as string) as {
          kind: string;
          data: {
            id: number;
            poll: {
              question: string;
              answers: Array<{ text: string; respondents: number[] }>;
            };
          };
          error: string;
        };

        sendSocketMessage(socket, "vote-in-poll", {
          messageId: response.data.id,
          response: "Yes",
        });

        requests++;
      } else {
        responseString = event.data as string;
        socket.close();
      }
    };

    sendSocketMessage(socket, "send-chat-message", {
      chatroomId: 1,
      message: "This is my poll",
      poll,
    });

    await waitForSocketState(socket, socket.CLOSED);

    const response = JSON.parse(responseString) as {
      kind: string;
      data: {
        success: boolean;
      };
      error: string;
    };

    expect(response.kind).toBe("vote-in-poll");
    expect(response.data.success).toBe(true);
    expect(response.error).toBeUndefined();
  });

  it("should fail to send a message to a chatroom that does not exist", async () => {
    socket.onmessage = (event) => {
      expect(event).toBeDefined();
      responseString = event.data as string;
      socket.close();
    };

    sendSocketMessage(socket, "send-chat-message", {
      chatroomId: 666666,
      message: "Hello",
    });

    await waitForSocketState(socket, socket.CLOSED);

    const response = JSON.parse(responseString) as {
      kind: string;
      data: { message: string };
      error: string;
    };

    expect(response.kind).toBe("send-chat-message");
    expect(response.data).toBeUndefined();
    expect(response.error).toBe("That chatroom does not exist.");
  });
});
