import { message as showMessage } from "antd";
import { makeHttpRequest } from "helpers";
import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { SafeClient } from "schemas";
import { requireClientLoader } from "./client.loader";

export type ChatroomUpdate = Pick<ChatroomData, "title" | "description"> & {
  password?: null | string;
  blacklist?: null | Record<number, true>;
  whitelist?: null | Record<number, true>;
};

export interface ChatroomSettingsLoaderData {
  client: SafeClient;
  chatroom: ChatroomData;
  updateChatroom(update: ChatroomUpdate): Promise<unknown>;
}

export async function chatroomSettingsLoader(loader: LoaderFunctionArgs) {
  const { client } = await requireClientLoader(loader);
  const chatroomId = parseInt(loader.params.chatroomId as string);

  try {
    const { chatroom } = (await makeHttpRequest(
      "get",
      `/chat/chatrooms/${chatroomId}`
    )) as {
      chatroom: ChatroomData;
    };

    return {
      client,
      chatroom,
      async updateChatroom(update: ChatroomUpdate) {
        try {
          await makeHttpRequest("patch", `/chat/chatrooms/${chatroomId}`, {
            update,
          });

          showMessage.success("Chatroom updated.");
        } catch (error) {
          showMessage.error("Unable to update chatroom.");
        }
      },
    };
  } catch (error) {
    console.error({ error });
    throw redirect("/chat");
  }
}
