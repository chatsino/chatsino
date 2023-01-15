import { makeHttpRequest } from "helpers";
import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { message as showMessage } from "ui";
import { requireClientLoader } from "./client.loader";

export interface RoomLoaderData {
  client: ChatsinoUser;
  room: ChatsinoRoom;
  sendMessage(message: string): Promise<unknown>;
  pinMessage(messageId: number): Promise<unknown>;
  deleteMessage(messageId: number): Promise<unknown>;
}

export async function roomLoader(
  loader: LoaderFunctionArgs
): Promise<RoomLoaderData> {
  const { roomId } = loader.params;
  const { client } = await requireClientLoader(loader);

  try {
    const { room } = (await makeHttpRequest(
      "get",
      `/chat/rooms/${roomId}`
    )) as {
      room: ChatsinoRoom;
    };

    return {
      client,
      room,
      async sendMessage(message: string) {
        try {
          await makeHttpRequest("post", `/chat/rooms/${roomId}/messages`, {
            roomId,
            message,
          });
        } catch (error) {
          showMessage.error(`Unable to send message.`);
        }
      },
      async pinMessage(messageId: number) {
        try {
          (await makeHttpRequest(
            "post",
            `/chat/rooms/${roomId}/messages/${messageId}/pin`
          )) as {
            message: ChatsinoMessage;
          };

          showMessage.success(`Message pinned.`);
        } catch (error) {
          showMessage.error("Unable to pin message.");
        }
      },
      async deleteMessage(messageId: number) {
        try {
          await makeHttpRequest(
            "delete",
            `/chat/rooms/${roomId}/messages/${messageId}`
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
