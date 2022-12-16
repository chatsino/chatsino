import * as yup from "yup";

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
