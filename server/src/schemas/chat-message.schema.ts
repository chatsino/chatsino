import * as yup from "yup";
import { clientChatUserSchema } from "./client.schema";

export const chatMessagePollAnswerSchema = yup.object({
  text: yup.string().required(),
  respondents: yup.array(yup.number().required()).required(),
});

export const chatMessagePollSchema = yup.object({
  question: yup.string().required(),
  answers: yup.array(chatMessagePollAnswerSchema).required(),
});

export const chatMessageSchema = yup
  .object({
    id: yup.number().required(),
    clientId: yup.number().required(),
    chatroomId: yup.number().required(),
    content: yup.string().required(),
    pinned: yup.boolean().required(),
    poll: chatMessagePollSchema.optional().nullable().default(null),
    createdAt: yup.string().required(),
    updatedAt: yup.string().required(),
  })
  .required();

export const hydratedChatMessageSchema = chatMessageSchema.shape({
  author: clientChatUserSchema,
});

export const sendChatMessageSchema = yup
  .object({
    chatroomId: yup.number().required(),
    message: yup.string().min(1).required(),
    password: yup.string().optional(),
    poll: yup
      .object({
        question: yup.string().required(),
        answers: yup
          .array(
            yup
              .object({
                text: yup.string().required(),
                respondents: yup.array(yup.number().required()).required(),
              })
              .required()
          )
          .required(),
      })
      .optional()
      .default(undefined),
  })
  .required();

export const voteInPollSchema = yup
  .object({
    messageId: yup.number().required(),
    response: yup.string().required(),
  })
  .required();

export const editChatMessageSchema = yup
  .object({
    message: yup.string().min(1).required(),
  })
  .required();

export const reactToChatMessageSchema = yup
  .object({
    reaction: yup.string().min(1).required(),
  })
  .required();

export const newChatMessageSchema = yup
  .object({
    message: hydratedChatMessageSchema,
  })
  .required();

export const chatMessageUpdatedSchema = yup
  .object({
    message: hydratedChatMessageSchema,
  })
  .required();

export const chatMessageDeletedSchema = yup
  .object({
    chatroomId: yup.number().required(),
    messageId: yup.number().required(),
  })
  .required();
