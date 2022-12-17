import { makeHttpRequest } from "helpers";
import { Chatroom } from "hooks";
import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { SafeClient } from "schemas";
import { requireClientLoader } from "./client.loader";

export interface ChatroomLoaderData {
  client: SafeClient;
  chatroom: Chatroom;
  messages: ChatMessageData[];
  users: ChatUserData[];
}

export interface ChatroomListLoaderData {
  chatrooms: Chatroom[];
}

export async function chatroomLoader(
  loader: LoaderFunctionArgs
): Promise<ChatroomLoaderData> {
  const { chatroomId } = loader.params;
  const { client } = await requireClientLoader(loader);

  try {
    const { chatroom, messages, users } = (await makeHttpRequest(
      "get",
      `/chat/chatrooms/${chatroomId}`
    )) as {
      chatroom: Chatroom;
      messages: ChatMessageData[];
      users: ChatUserData[];
    };

    return {
      client,
      chatroom,
      messages,
      users,
    };
  } catch (error) {
    console.error({ error });
    throw redirect("/chat");
  }
}

export async function chatroomListLoader(): Promise<ChatroomListLoaderData> {
  const { chatrooms } = (await makeHttpRequest("get", "/chat/chatrooms")) as {
    chatrooms: Chatroom[];
  };

  return {
    chatrooms,
  };
}
