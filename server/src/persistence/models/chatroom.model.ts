import { createLogger } from "logger";
import { postgres } from "persistence";

export interface Chatroom {
  id: number;
  avatar: string;
  title: string;
  description: string;
  password?: string;
  blacklist?: Record<number, true>;
  whitelist?: Record<number, true>;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatroomCreate = Pick<
  Chatroom,
  "avatar" | "title" | "description" | "password"
>;

export type ChatroomUpdate = Partial<
  Pick<
    Chatroom,
    "avatar" | "title" | "description" | "password" | "blacklist" | "whitelist"
  >
>;

export const CHATROOM_MODEL_LOGGER = createLogger("Chatroom Model");

// #region SQL
export const CHATROOM_TABLE_NAME = "chatrooms";

/* istanbul ignore next */
export async function createChatroomTable() {
  const exists = await postgres.schema.hasTable(CHATROOM_TABLE_NAME);

  if (exists) {
    CHATROOM_MODEL_LOGGER.info({ table: CHATROOM_TABLE_NAME }, "Table exists.");
  } else {
    CHATROOM_MODEL_LOGGER.info(
      { table: CHATROOM_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(CHATROOM_TABLE_NAME, (table) => {
      table.increments("id", { primaryKey: true });
      table.string("avatar").notNullable();
      table.string("title").notNullable();
      table.string("description").notNullable();
      table.string("password").nullable();
      table.jsonb("blacklist").nullable();
      table.jsonb("whitelist").nullable();
      table
        .integer("createdBy")
        .notNullable()
        .references("clients.id")
        .onDelete("SET NULL");
      table
        .integer("updatedBy")
        .notNullable()
        .references("clients.id")
        .onDelete("SET NULL");
      table.timestamps(true, true, true);
    });
  }
}

/* istanbul ignore next */
export async function dropChatroomTable() {
  const exists = await postgres.schema.hasTable(CHATROOM_TABLE_NAME);

  if (exists) {
    CHATROOM_MODEL_LOGGER.info(
      { table: CHATROOM_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(CHATROOM_TABLE_NAME);
  } else {
    CHATROOM_MODEL_LOGGER.info(
      { table: CHATROOM_TABLE_NAME },
      "Table does not exist."
    );
  }
}
// #endregion

export async function createChatroom(
  clientId: number,
  { avatar, title, description, password }: ChatroomCreate
) {
  try {
    const [chatroom] = await postgres<Chatroom>(CHATROOM_TABLE_NAME)
      .insert({
        avatar,
        title,
        description,
        password,
        createdBy: clientId,
        updatedBy: clientId,
      })
      .returning("*");

    /* istanbul ignore if */
    if (!chatroom) {
      throw new Error();
    }

    return chatroom;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function updateChatroom(
  chatroomId: number,
  update: ChatroomUpdate
) {
  try {
    const [updatedChatroom] = await postgres<Chatroom>(CHATROOM_TABLE_NAME)
      .where("id", chatroomId)
      .update(update)
      .returning("*");

    if (!updatedChatroom) {
      throw new Error();
    }

    return updatedChatroom;
  } catch (error) {
    return null;
  }
}

export async function deleteChatroom(chatroomId: number) {
  try {
    const [chatroom] = await postgres<Chatroom>(CHATROOM_TABLE_NAME)
      .where("id", chatroomId)
      .delete()
      .returning("*");

    if (!chatroom) {
      throw new Error();
    }

    return chatroom;
  } catch (error) {
    return null;
  }
}

export async function deleteAllChatrooms() {
  try {
    const chatrooms = await postgres<Chatroom>(CHATROOM_TABLE_NAME)
      .delete()
      .returning("*");

    return chatrooms;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function getChatroom(chatroomId: number) {
  try {
    const chatroom = await postgres<Chatroom>(CHATROOM_TABLE_NAME)
      .where("id", chatroomId)
      .first();

    if (!chatroom) {
      throw new Error();
    }

    return chatroom;
  } catch (error) {
    return null;
  }
}

export async function getAllChatrooms() {
  try {
    const chatrooms = await postgres<Chatroom>(CHATROOM_TABLE_NAME).select();

    return chatrooms;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function blacklistFromChatroom(
  chatroomId: number,
  clientId: number
) {
  try {
    const chatroom = await getChatroom(chatroomId);

    if (!chatroom) {
      throw new Error();
    }

    const blacklist = chatroom.blacklist ?? {};
    const previouslyBlacklisted = blacklist[clientId];

    if (previouslyBlacklisted) {
      delete blacklist[clientId];
    } else {
      blacklist[clientId] = true;
    }

    const updatedChatroom = await updateChatroom(chatroomId, {
      blacklist,
    });

    return updatedChatroom;
  } catch (error) {
    return null;
  }
}

export async function whitelistToChatroom(
  chatroomId: number,
  clientId: number
) {
  try {
    const chatroom = await getChatroom(chatroomId);

    if (!chatroom) {
      throw new Error();
    }

    const whitelist = chatroom.whitelist ?? {};
    const previouslyWhitelisted = whitelist[clientId];

    if (previouslyWhitelisted) {
      delete whitelist[clientId];
    } else {
      whitelist[clientId] = true;
    }

    const updatedChatroom = await updateChatroom(chatroomId, {
      whitelist,
    });

    return updatedChatroom;
  } catch (error) {
    return null;
  }
}
