import * as config from "config";
import { meetsPermissionRequirement } from "helpers";
import { createLogger } from "logger";
import { CHATROOM_CACHE, postgres } from "persistence";
import { Client, getClientById } from "./client.model";

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

export type HydratedChatroomQuery = Chatroom & {
  createdById: number;
  createdByAvatar: string;
  createdByUsername: string;
  updatedById: number;
  updatedByAvatar: string;
  updatedByUsername: string;
};

export type HydratedChatroom = Omit<Chatroom, "createdBy" | "updatedBy"> & {
  createdBy: {
    id: number;
    avatar: string;
    username: string;
  };
  updatedBy: {
    id: number;
    avatar: string;
    username: string;
  };
  public: boolean;
  users: Client[];
};

export const CHATROOM_MODEL_LOGGER = createLogger(
  config.LOGGER_NAMES.CHATROOM_MODEL
);

// #region Table
/* istanbul ignore next */
export async function createChatroomTable() {
  const exists = await postgres.schema.hasTable(config.CHATROOM_TABLE_NAME);

  if (exists) {
    CHATROOM_MODEL_LOGGER.info(
      { table: config.CHATROOM_TABLE_NAME },
      "Table exists."
    );
  } else {
    CHATROOM_MODEL_LOGGER.info(
      { table: config.CHATROOM_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(config.CHATROOM_TABLE_NAME, (table) => {
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
  const exists = await postgres.schema.hasTable(config.CHATROOM_TABLE_NAME);

  if (exists) {
    CHATROOM_MODEL_LOGGER.info(
      { table: config.CHATROOM_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(config.CHATROOM_TABLE_NAME);
  } else {
    CHATROOM_MODEL_LOGGER.info(
      { table: config.CHATROOM_TABLE_NAME },
      "Table does not exist."
    );
  }
}
// #endregion

// #region CRUD
export async function createChatroom(
  clientId: number,
  { avatar, title, description, password }: ChatroomCreate
) {
  try {
    const [chatroom] = await postgres<Chatroom>(config.CHATROOM_TABLE_NAME)
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

    CHATROOM_CACHE.CHATROOM_LIST.clear();

    return chatroom;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function readChatroom(chatroomId: number) {
  try {
    const chatroom = await postgres<Chatroom>(config.CHATROOM_TABLE_NAME)
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

export async function readHydratedChatroom(chatroomId: number) {
  try {
    const cached = await CHATROOM_CACHE.CHATROOM.read(chatroomId);

    if (cached) {
      return {
        chatroom: cached,
        cached: true,
      };
    } else {
      const { rows } = (await postgres.raw(
        `
        SELECT
          chatroom.id,
          chatroom.avatar,
          chatroom.title,
          chatroom.description,
          chatroom.password,
          chatroom."createdAt",
          chatroom."updatedAt",
          client_created.id as "createdById",
          client_created.avatar as "createdByAvatar",
          client_created.username as "createdByUsername",
          client_updated.id as "updatedById",
          client_updated.avatar as "updatedByAvatar",
          client_updated.username as "updatedByUsername"
        FROM
          chatroom
          JOIN client client_created ON client_created.id = chatroom."createdBy"
          JOIN client client_updated ON client_updated.id = chatroom."updatedBy"
        WHERE
          chatroom.id = ?;
        `,
        [chatroomId]
      )) as {
        rows: HydratedChatroomQuery[];
      };
      const [result] = rows;
      const {
        createdById,
        createdByAvatar,
        createdByUsername,
        updatedById,
        updatedByAvatar,
        updatedByUsername,
        ...chatroom
      } = result;
      const hydrated = {
        ...chatroom,
        createdBy: {
          id: createdById,
          avatar: createdByAvatar,
          username: createdByUsername,
        },
        updatedBy: {
          id: updatedById,
          avatar: updatedByAvatar,
          username: updatedByUsername,
        },
        public:
          !chatroom.password &&
          Object.keys(chatroom.whitelist ?? {}).length === 0,
        users: await CHATROOM_CACHE.CHATROOM_USERS.hydrated(chatroomId),
      } as HydratedChatroom;

      CHATROOM_CACHE.CHATROOM.cache(hydrated);
      CHATROOM_CACHE.CHATROOM_LIST.clear();

      return {
        chatroom: hydrated,
        cached: false,
      };
    }
  } catch (error) {
    return null;
  }
}

export async function readChatroomList() {
  try {
    const cached = await CHATROOM_CACHE.CHATROOM_LIST.read();

    if (cached) {
      return {
        chatrooms: cached,
        cached: true,
      };
    } else {
      const { rows } = (await postgres.raw(
        `
          SELECT chatroom.id, chatroom.avatar, chatroom.title, chatroom.description, chatroom.password, chatroom."createdAt", chatroom."updatedAt",
              client_created.id as "createdById", client_created.avatar as "createdByAvatar", client_created.username as "createdByUsername",
              client_updated.id as "updatedById", client_updated.avatar as "updatedByAvatar", client_updated.username as "updatedByUsername"
          FROM chatroom
          JOIN client client_created ON client_created.id = chatroom."createdBy"
          JOIN client client_updated ON client_updated.id = chatroom."updatedBy";
        `
      )) as {
        rows: HydratedChatroomQuery[];
      };
      const chatrooms = (await Promise.all(
        rows.map(
          async ({
            createdById,
            createdByAvatar,
            createdByUsername,
            updatedById,
            updatedByAvatar,
            updatedByUsername,
            ...chatroom
          }) => ({
            ...chatroom,
            createdBy: {
              id: createdById,
              avatar: createdByAvatar,
              username: createdByUsername,
            },
            updatedBy: {
              id: updatedById,
              avatar: updatedByAvatar,
              username: updatedByUsername,
            },
            public:
              !chatroom.password &&
              Object.keys(chatroom.whitelist ?? {}).length === 0,
            users: await CHATROOM_CACHE.CHATROOM_USERS.hydrated(chatroom.id),
          })
        )
      )) as HydratedChatroom[];

      CHATROOM_CACHE.CHATROOM_LIST.cache(chatrooms);

      return {
        chatrooms,
        cached: false,
      };
    }
  } catch (error) {
    return null;
  }
}

export async function updateChatroom(
  chatroomId: number,
  update: ChatroomUpdate
) {
  try {
    const [updatedChatroom] = await postgres<Chatroom>(
      config.CHATROOM_TABLE_NAME
    )
      .where("id", chatroomId)
      .update(update)
      .returning("*");

    if (!updatedChatroom) {
      throw new Error();
    }

    CHATROOM_CACHE.CHATROOM.clear(chatroomId);
    CHATROOM_CACHE.CHATROOM_LIST.clear();
    CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.clearAllClients(chatroomId);

    return updatedChatroom;
  } catch (error) {
    return null;
  }
}

export async function deleteChatroom(chatroomId: number) {
  try {
    const [chatroom] = await postgres<Chatroom>(config.CHATROOM_TABLE_NAME)
      .where("id", chatroomId)
      .delete()
      .returning("*");

    if (!chatroom) {
      throw new Error();
    }

    CHATROOM_CACHE.CHATROOM.clear(chatroomId);
    CHATROOM_CACHE.CHATROOM_LIST.clear();
    CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.clearAllClients(chatroomId);

    return chatroom;
  } catch (error) {
    return null;
  }
}

export async function deleteAllChatrooms() {
  try {
    const chatrooms = await postgres<Chatroom>(config.CHATROOM_TABLE_NAME)
      .delete()
      .returning("*");

    CHATROOM_CACHE.CHATROOM_LIST.clear();

    for (const { id: chatroomId } of chatrooms) {
      CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.clearAllClients(chatroomId);
    }

    return chatrooms;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}
// #endregion

export function safetifyChatroom<
  T extends {
    password?: string;
    blacklist?: Record<number, true>;
    whitelist?: Record<number, true>;
  }
>(chatroom: T) {
  const { password, blacklist, whitelist, ...safeChatroom } = chatroom;

  return safeChatroom;
}

export async function blacklistFromChatroom(
  chatroomId: number,
  clientId: number
) {
  try {
    const chatroom = await readChatroom(chatroomId);

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
    const chatroom = await readChatroom(chatroomId);

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

export async function changeChatroomAvatar(chatroomId: number, url: string) {
  try {
    await updateChatroom(chatroomId, {
      avatar: url,
    });

    const updatedChatroomData = await readHydratedChatroom(chatroomId);

    if (!updatedChatroomData) {
      throw new Error();
    }

    return updatedChatroomData.chatroom;
  } catch (error) {
    CHATROOM_MODEL_LOGGER.error({ error }, "Failed to change chatroom avatar.");

    return null;
  }
}

export async function canClientMessageChatroom(
  clientId: number,
  chatroomId: number,
  password?: string
) {
  try {
    const cached = await CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.read(
      clientId,
      chatroomId
    );

    if (cached) {
      return {
        can: cached.can,
        reason: cached.reason,
        cached: true,
      };
    } else {
      const chatroom = await readChatroom(chatroomId);

      let reason = "";

      if (!chatroom) {
        reason = "That chatroom does not exist.";
      } else if (chatroom.whitelist && !chatroom.whitelist[clientId]) {
        reason = "You are not on the whitelist.";
      } else if (chatroom.blacklist && chatroom.blacklist[clientId]) {
        reason = "You are on the blacklist.";
      } else if (chatroom.password && password !== chatroom.password) {
        reason = "Wrong password.";
      }

      const result = {
        can: !Boolean(reason),
        reason,
      };

      CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.cache(
        clientId,
        chatroomId,
        result
      );

      return {
        ...result,
        cached: false,
      };
    }
  } catch (error) {
    return {
      can: false,
      reason: "An error occurred.",
      cached: false,
    };
  }
}

export async function canClientModifyChatroom(
  clientId: number,
  chatroomId: number
) {
  try {
    const cached = await CHATROOM_CACHE.CAN_CLIENT_MODIFY_CHATROOM.read(
      clientId,
      chatroomId
    );

    if (cached != null) {
      return {
        can: cached,
        cached: true,
      };
    } else {
      const client = await getClientById(clientId);
      const chatroom = await readChatroom(chatroomId);
      const isOwnChatroom = Boolean(
        client && chatroom && client.id === chatroom.createdBy
      );
      const isAdministrator = Boolean(
        client &&
          meetsPermissionRequirement(client.permissionLevel, "admin:limited")
      );
      const can = isOwnChatroom || isAdministrator;

      CHATROOM_CACHE.CAN_CLIENT_MODIFY_CHATROOM.cache(
        clientId,
        chatroomId,
        can
      );

      return {
        can,
        cached: false,
      };
    }
  } catch (error) {
    return {
      can: false,
      cached: false,
    };
  }
}
