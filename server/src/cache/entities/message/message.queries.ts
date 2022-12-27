import { executeCommand } from "cache/object-mapper";
import { createMessageRepository, Message } from "./message.schema";

export const messageQueries = {
  allMessages: () =>
    executeCommand((client) =>
      createMessageRepository(client).search().return.all()
    ) as Promise<Message[]>,
  totalMessages: () =>
    executeCommand((client) =>
      createMessageRepository(client).search().return.count()
    ) as Promise<number>,
  userMessages: (userId: string) =>
    executeCommand((client) =>
      createMessageRepository(client)
        .search()
        .where("userId")
        .equals(userId)
        .return.all()
    ) as Promise<Message[]>,
};
