import { createLogger } from "logger";
import { postgres } from "persistence";

export interface ChatMessage {
  id: number;
  clientId: number;
  chatroomId: number;
  content: string;
  reactions: Record<string, number[]>;
  createdAt: Date;
  updatedAt: Date;
}

export const CHAT_MESSAGE_MODEL_LOGGER = createLogger("Chat Message Model");

// #region SQL
export const CHAT_MESSAGE_TABLE_NAME = "chat_messages";

/* istanbul ignore next */
export async function createChatMessageTable() {
  const exists = await postgres.schema.hasTable(CHAT_MESSAGE_TABLE_NAME);

  if (exists) {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Table exists."
    );
  } else {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(CHAT_MESSAGE_TABLE_NAME, (table) => {
      table.increments("id", { primaryKey: true });
      table
        .integer("clientId")
        .references("clients.id")
        .notNullable()
        .onDelete("CASCADE");
      table
        .integer("chatroomId")
        .references("chatrooms.id")
        .notNullable()
        .onDelete("CASCADE");
      table.string("content").notNullable().defaultTo("");
      table.jsonb("reactions").notNullable().defaultTo({});
      table.timestamps(true, true, true);
    });
  }
}

/* istanbul ignore next */
export async function dropChatMessageTable() {
  const exists = await postgres.schema.hasTable(CHAT_MESSAGE_TABLE_NAME);

  if (exists) {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(CHAT_MESSAGE_TABLE_NAME);
  } else {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Table does not exist."
    );
  }
}
// #endregion

export async function sendChatMessage(
  clientId: number,
  chatroomId: number,
  content: string
) {
  try {
    const [message] = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .insert({
        clientId,
        chatroomId,
        content,
      })
      .returning("*");

    /* istanbul ignore if */
    if (!message) {
      throw new Error();
    }

    return message;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function editChatMessage(messageId: number, content: string) {
  try {
    const [message] = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .where("id", messageId)
      .update({
        content,
      })
      .returning("*");

    if (!message) {
      throw new Error();
    }

    return message;
  } catch (error) {
    return null;
  }
}

export async function deleteChatMessage(messageId: number) {
  try {
    const [message] = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .where("id", messageId)
      .delete()
      .returning("*");

    if (!message) {
      throw new Error();
    }

    return message;
  } catch (error) {
    return null;
  }
}

export async function reactToChatMessage(
  messageId: number,
  clientId: number,
  reaction: string
) {
  try {
    const message = await getChatMessage(messageId);

    if (!message) {
      throw new Error();
    }

    if (!message.reactions[reaction]) {
      message.reactions[reaction] = [];
    }

    const clientsWithReaction = message.reactions[reaction];
    const updatedClientsWithReaction = clientsWithReaction.includes(clientId)
      ? clientsWithReaction.filter((id) => id !== clientId)
      : clientsWithReaction.concat(clientId);
    const nextReactions = {
      ...message.reactions,
      [reaction]: updatedClientsWithReaction,
    };

    if (updatedClientsWithReaction.length === 0) {
      delete nextReactions[reaction];
    }

    const [updatedMessage] = await postgres<ChatMessage>(
      CHAT_MESSAGE_TABLE_NAME
    )
      .where("id", messageId)
      .update({
        reactions: nextReactions,
      })
      .returning("*");

    return updatedMessage;
  } catch (error) {
    return null;
  }
}

export async function getChatMessage(messageId: number) {
  try {
    const message = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .where("id", messageId)
      .first();

    if (!message) {
      throw new Error();
    }

    return message;
  } catch (error) {
    return null;
  }
}
