import { message as showMessage } from "antd";
import { makeHttpRequest } from "helpers";
import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { SafeClient } from "schemas";
import { requireClientLoader } from "./client.loader";

export interface ChatroomLoaderData {
  client: SafeClient;
  chatroom: ChatroomData;
  messages: ChatMessageData[];
  users: ChatUserData[];
  sendMessage(message: string): Promise<unknown>;
  pinMessage(messageId: number): Promise<unknown>;
  deleteMessage(messageId: number): Promise<unknown>;
}

export interface ChatroomListLoaderData {
  chatrooms: ChatroomData[];
}

export async function chatroomLoader(
  loader: LoaderFunctionArgs
): Promise<ChatroomLoaderData> {
  const chatroomId = parseInt(loader.params.chatroomId as string);
  const { client } = await requireClientLoader(loader);

  try {
    const { chatroom, messages, users } = (await makeHttpRequest(
      "get",
      `/chat/chatrooms/${chatroomId}`
    )) as {
      chatroom: ChatroomData;
      messages: ChatMessageData[];
      users: ChatUserData[];
    };

    return {
      client,
      chatroom,
      messages,
      users,
      async sendMessage(message: string) {
        try {
          await makeHttpRequest(
            "post",
            `/chat/chatrooms/${chatroomId}/messages`,
            {
              chatroomId,
              message,
            }
          );
        } catch (error) {
          showMessage.error(`Unable to send message.`);
        }
      },
      async pinMessage(messageId: number) {
        try {
          const {
            message: { pinned },
          } = (await makeHttpRequest(
            "post",
            `/chat/chatrooms/${chatroomId}/messages/${messageId}/pin`
          )) as {
            message: ChatMessageData;
          };

          showMessage.success(`Message ${pinned ? "pinned" : "unpinned"}.`);
        } catch (error) {
          showMessage.error("Unable to pin message.");
        }
      },
      async deleteMessage(messageId: number) {
        try {
          await makeHttpRequest(
            "delete",
            `/chat/chatrooms/${chatroomId}/messages/${messageId}`
          );

          showMessage.success("Message deleted.");
        } catch (error) {
          showMessage.error("Unable to delete message.");
        }
      },
    };
  } catch (error) {
    console.error({ error });
    throw redirect("/chat");
  }
}

export async function chatroomListLoader(): Promise<ChatroomListLoaderData> {
  const { chatrooms } = (await makeHttpRequest("get", "/chat/chatrooms")) as {
    chatrooms: ChatroomData[];
  };

  return {
    chatrooms,
  };
}
