import { makeHttpRequest } from "helpers";

export interface ChatroomListLoaderData {
  chatrooms: ChatroomData[];
}

export async function chatroomListLoader(): Promise<ChatroomListLoaderData> {
  const { chatrooms } = (await makeHttpRequest("get", "/chat/chatrooms")) as {
    chatrooms: ChatroomData[];
  };

  return {
    chatrooms,
  };
}
