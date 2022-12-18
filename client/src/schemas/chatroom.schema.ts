import * as yup from "yup";

export const joinPrivateRoomSchema = yup.object({
  room: yup.string().min(1).required(),
  password: yup.string().optional().default(""),
});

export const createChatroomSchema = yup.object({
  title: yup.string().min(3).required(),
  description: yup.string().min(3).required(),
  password: yup.string().nullable().optional().default(null),
});

export const updateChatroomSchema = createChatroomSchema.shape({
  blacklist: yup.object().nullable().optional().default(null),
  whitelist: yup.object().nullable().optional().default(null),
});
