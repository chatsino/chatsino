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
      sendMessage(message: string) {
        return makeHttpRequest(
          "post",
          `/chat/chatrooms/${chatroomId}/messages`,
          {
            chatroomId,
            message,
          }
        );
      },
      async deleteMessage(messageId: number) {
        try {
          await makeHttpRequest(
            "delete",
            `/chat/chatrooms/${chatroomId}/messages/${messageId}`
          );

          showMessage.success("Message deleted.");
        } catch (error) {
          showMessage.error(error.message);
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
