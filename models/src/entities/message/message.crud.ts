import { rightNow } from "helpers";
import { executeCommand } from "cache";
import { messageErrors } from "./message.errors";
import {
  createMessageRepository,
  HydratedMessage,
  Message,
} from "./message.schema";
import { MessageCreate } from "./message.types";

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

      return message.hydrate();
    }) as Promise<HydratedMessage>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) =>
      [await createMessageRepository(client).fetch(...ids)]
        .flat()
        .filter((each) => each.id)
    ) as Promise<Message[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const message = await createMessageRepository(client).fetch(id);

      if (!message.id) {
        throw new messageErrors.NotFoundError();
      }

      return message;
    }) as Promise<Message>,
  update: (id: string, data: Partial<Message>) =>
    executeCommand(async (client) => {
      const message = await messageCrud.read(id);

      Object.assign(message, {
        ...data,
        changedAt: rightNow(),
      });

      await createMessageRepository(client).save(message);

      return message.hydrate();
    }) as Promise<HydratedMessage>,
  delete: (id: string) =>
    executeCommand((client) =>
      createMessageRepository(client).remove(id)
    ) as Promise<void>,
};
