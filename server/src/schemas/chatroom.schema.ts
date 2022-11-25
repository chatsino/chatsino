import * as yup from "yup";

export const sendChatMessageSchema = yup
  .object({
    chatroomId: yup.string().required(),
    message: yup.string().min(1).required(),
  })
  .required();

export const listChatroomMessagesSchema = yup
  .object({
    chatroomId: yup.string().required(),
  })
  .required();
