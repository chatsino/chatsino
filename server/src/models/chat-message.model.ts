import * as config from "config";
import { createLogger } from "logger";
import { getClientById } from "models";
import {
  clearCachedValue,
  getCachedValue,
  postgres,
  setCachedValue,
} from "persistence";

export interface ChatMessage {
  id: number;
  clientId: number;
  chatroomId: number;
  content: string;
  pinned: boolean;
  reactions: Record<string, number[]>;
  poll: null | {
    question: string;
    answers: Array<{ text: string; respondents: Array<number> }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ChatMessageUpdate = Partial<
  Pick<ChatMessage, "content" | "reactions" | "pinned" | "poll">
>;

export type HydratedChatMessageQuery = ChatMessage & {
  authorId: number;
  authorAvatar: string;
  authorUsername: string;
};

export type HydratedChatMessage = ChatMessage & {
  author: {
    id: number;
    avatar: string;
    username: string;
  };
};

export const CHAT_MESSAGE_MODEL_LOGGER = createLogger(
  config.LOGGER_NAMES.CHAT_MESSAGE_MODEL
);

// #region Table
export const CHAT_MESSAGE_TABLE_NAME = "chat_message";

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
      table.jsonb("poll").nullable().defaultTo({});
      table.boolean("pinned").notNullable().defaultTo(false);
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

// #region CRUD
export async function createChatMessage(
  clientId: number,
  chatroomId: number,
  content: string,
  poll: null | ChatMessage["poll"] = null
) {
  try {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { clientId, chatroomId, content, poll },
      "Creating a chat message."
    );

    const [message] = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .insert({
        clientId,
        chatroomId,
        content,
        poll,
      })
      .returning("*");

    /* istanbul ignore if */
    if (!message) {
      throw new Error();
    }

    CHAT_MESSAGE_CACHE.CHAT_MESSAGE.cache(message);
    CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.clear(message.chatroomId);

    return message;
  } catch (error) {
    /* istanbul ignore next */
    CHAT_MESSAGE_MODEL_LOGGER.error({ error }, "Error creaing a chat message.");

    /* istanbul ignore next */
    return null;
  }
}

export async function readChatMessage(messageId: number) {
  try {
    const cached = await CHAT_MESSAGE_CACHE.CHAT_MESSAGE.read(messageId);

    if (cached) {
      return {
        message: cached,
        cached: true,
      };
    } else {
      const [message] = await postgres<ChatMessage>(
        CHAT_MESSAGE_TABLE_NAME
      ).where("id", messageId);

      if (!message) {
        throw new Error();
      }

      CHAT_MESSAGE_CACHE.CHAT_MESSAGE.cache(message);

      return {
        message,
        cached: false,
      };
    }
  } catch (error) {
    return null;
  }
}

export async function readChatMessageList(chatroomId: number) {
  try {
    const cached = await CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.read(chatroomId);

    if (cached) {
      return {
        messages: cached as HydratedChatMessage[],
        cached: true,
      };
    } else {
      const { rows } = (await postgres.raw(
        `
        SELECT
          chat_message.*,
          author.id as "authorId",
          author.avatar as "authorAvatar",
          author.username as "authorUsername"
        FROM
          chat_message
          JOIN client author ON author.id = chat_message."clientId"
        WHERE
          chat_message."chatroomId" = ?;
        `,
        [chatroomId]
      )) as {
        rows: HydratedChatMessageQuery[];
      };
      const chatMessageList = rows.map(
        ({ authorId, authorAvatar, authorUsername, ...message }) => ({
          ...message,
          author: {
            id: authorId,
            avatar: authorAvatar,
            username: authorUsername,
          },
        })
      ) as HydratedChatMessage[];

      CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.cache(chatroomId, chatMessageList);

      return {
        messages: chatMessageList,
        cached: false,
      };
    }
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function updateChatMessage(
  messageId: number,
  update: ChatMessageUpdate
) {
  try {
    const [message] = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .where("id", messageId)
      .update(update)
      .returning("*");
    const author = await getClientById(message.clientId);

    if (!message || !author) {
      throw new Error();
    }

    const hydratedMessage = {
      ...message,
      author: {
        id: author.id,
        avatar: author.avatar,
        username: author.username,
      },
    } as HydratedChatMessage;

    CHAT_MESSAGE_CACHE.CHAT_MESSAGE.cache(message);
    CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.clear(message.chatroomId);

    return hydratedMessage;
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

    CHAT_MESSAGE_CACHE.CHAT_MESSAGE.clear(message.id);
    CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.clear(message.chatroomId);

    return message;
  } catch (error) {
    return null;
  }
}

export async function deleteAllChatMessages(chatroomId: number) {
  try {
    const messages = await postgres<ChatMessage>(CHAT_MESSAGE_TABLE_NAME)
      .where("chatroomId", chatroomId)
      .delete()
      .returning("*");

    CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.clear(chatroomId);

    for (const { id: messageId } of messages) {
      CHAT_MESSAGE_CACHE.CHAT_MESSAGE.clear(messageId);
    }

    return messages;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}
// #endregion

export async function editChatMessage(messageId: number, content: string) {
  return updateChatMessage(messageId, { content });
}

export async function reactToChatMessage(
  messageId: number,
  clientId: number,
  reaction: string
) {
  try {
    const messageData = await readChatMessage(messageId);

    if (!messageData) {
      throw new Error();
    }

    const { message } = messageData;

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

    return updateChatMessage(messageId, { reactions: nextReactions });
  } catch (error) {
    return null;
  }
}

export function pinChatMessage(messageId: number) {
  return updateChatMessage(messageId, {
    pinned: postgres.raw("NOT ??", ["pinned"]) as unknown as boolean,
  });
}

export async function clientVotedInPoll(
  clientId: number,
  messageId: number,
  response: string
) {
  try {
    const messageData = await readChatMessage(messageId);

    if (!messageData) {
      throw new Error();
    }

    const { message } = messageData;

    if (!message.poll) {
      return null;
    }

    const { answers } = message.poll;
    const answerEntry = answers.find((answer) => answer.text === response);
    const previouslyAnswered = answers.some((answer) =>
      answer.respondents.includes(clientId)
    );

    if (!answerEntry || previouslyAnswered) {
      return null;
    }

    answerEntry.respondents.push(clientId);

    const votedMessage = await updateChatMessage(messageId, {
      poll: message.poll,
    });

    if (!votedMessage) {
      throw new Error();
    }

    return votedMessage;
  } catch (error) {
    return null;
  }
}

// #region Caching
export const CHAT_MESSAGE_CACHE = {
  CHAT_MESSAGE: {
    key: (messageId: number) =>
      [config.CHAT_MESSAGE_CACHE_KEY, messageId].join("/"),
    cache: (message: ChatMessage) =>
      setCachedValue(
        CHAT_MESSAGE_CACHE.CHAT_MESSAGE.key(message.id),
        JSON.stringify(message),
        config.CHAT_MESSAGE_CACHE_TTL_SECONDS
      ),
    read: (messageId: number) =>
      getCachedValue(
        CHAT_MESSAGE_CACHE.CHAT_MESSAGE.key(messageId)
      ) as Promise<null | ChatMessage>,
    clear: (messageId: number) =>
      clearCachedValue(CHAT_MESSAGE_CACHE.CHAT_MESSAGE.key(messageId)),
  },
  CHAT_MESSAGE_LIST: {
    key: (chatroomId: number) =>
      [config.CHAT_MESSAGE_LIST_CACHE_KEY, chatroomId].join("/"),
    cache: (chatroomId: number, chatMessageList: HydratedChatMessage[]) =>
      setCachedValue(
        CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.key(chatroomId),
        JSON.stringify(chatMessageList),
        config.CHAT_MESSAGE_CACHE_TTL_SECONDS
      ),
    read: (chatroomId: number) =>
      getCachedValue(CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.key(chatroomId)),
    clear: (chatroomId: number) =>
      clearCachedValue(CHAT_MESSAGE_CACHE.CHAT_MESSAGE_LIST.key(chatroomId)),
  },
};
// #endregion
