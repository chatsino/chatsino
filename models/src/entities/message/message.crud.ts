import { executeCommand } from "object-mapper";
import { rightNow } from "helpers";
import { createMessageRepository, Message } from "./message.schema";
import { MessageCreate, MessageNotFoundError } from "./message.types";

export const messageCrud = {
  create: async (data: MessageCreate) =>
    executeCommand(async (client) => {
      const repository = createMessageRepository(client);
      const message = repository.createEntity({
        ...data,
        createdAt: rightNow(),
        changedAt: rightNow(),
        reactions: [],
        poll: [],
        mentions: [],
      });

      message.id = message.entityId;

      await repository.save(message);

      return message;
    }) as Promise<Message>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) => {
      const messages = await createMessageRepository(client).fetch(...ids);

      return [messages].flat().filter((each) => each.id);
    }) as Promise<Message[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const message = await createMessageRepository(client).fetch(id);

      if (!message.id) {
        throw new MessageNotFoundError();
      }

      return message;
    }) as Promise<Message>,
  update: (id: string, data: Partial<Message>) =>
    executeCommand(async (client) => {
      const repository = createMessageRepository(client);
      const message = await repository.fetch(id);

      if (!message.id) {
        throw new MessageNotFoundError();
      }

      message.content = data.content ?? message.content;
      message.reactions = data.reactions ?? message.reactions;
      message.poll = data.poll ?? message.poll;
      message.mentions = data.mentions ?? message.mentions;
      message.changedAt = rightNow();

      await repository.save(message);

      return message;
    }),
  delete: (id: string) =>
    executeCommand((client) => createMessageRepository(client).remove(id)),
};
