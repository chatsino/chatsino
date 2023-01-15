import { makeHttpRequest } from "helpers";
import { LoaderFunctionArgs, redirect } from "react-router-dom";
import { SafeClient } from "schemas";
import { message as showMessage } from "ui";
import { requireClientLoader } from "./client.loader";

export type RoomUpdate = Pick<ChatsinoRoom, "title" | "description"> & {
  password?: null | string;
  blacklist?: null | Record<string, true>;
  whitelist?: null | Record<string, true>;
};

export interface RoomSettingsLoaderData {
  client: SafeClient;
  room: ChatsinoRoom;
  updateChatroom(update: RoomUpdate): Promise<unknown>;
}

export async function roomSettingsLoader(loader: LoaderFunctionArgs) {
  const { client } = await requireClientLoader(loader);
  const { roomId } = loader.params;

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
      async updateChatroom(update: RoomUpdate) {
        try {
          await makeHttpRequest("patch", `/chat/rooms/${roomId}`, {
            update,
          });

          showMessage.success("Room updated.");
        } catch (error) {
          showMessage.error("Unable to update room.");
        }
      },
    };
  } catch (error) {
    console.error({ error });
    throw redirect("/chat");
  }
}
