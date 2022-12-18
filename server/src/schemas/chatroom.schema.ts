import * as yup from "yup";
import { clientChatUserSchema } from "./client.schema";

export const chatroomSchema = yup
  .object({
    id: yup.number().required(),
    avatar: yup.string().optional().default(""),
    title: yup.string().required(),
    description: yup.string().required(),
    createdBy: clientChatUserSchema,
    updatedBy: clientChatUserSchema,
    createdAt: yup.string().required(),
    updatedAt: yup.string().required(),
  })
  .required();

export const listChatroomMessagesSchema = yup
  .object({
    chatroomId: yup.number().required(),
  })
  .required();

export const chatroomUpdatedSchema = yup
  .object({
    chatroom: chatroomSchema,
  })
  .required();
