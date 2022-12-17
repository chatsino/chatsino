import * as yup from "yup";

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

export const chatMessageAuthorSchema = yup
  .object({
    id: yup.number().required(),
    avatar: yup.string().optional().default(""),
    username: yup.string().required(),
  })
  .required();

export const hydratedChatMessageSchema = chatMessageSchema.shape({
  author: chatMessageAuthorSchema,
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

export const listChatroomMessagesSchema = yup
  .object({
    chatroomId: yup.number().required(),
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
