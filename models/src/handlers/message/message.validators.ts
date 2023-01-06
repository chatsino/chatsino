import * as yup from "yup";
import { MessageRequests } from "./message.requests";

const common = {
  entityId: yup.string().required(),
  content: yup.string().min(1).required(),
  reaction: yup.string().required(),
};

export const messageValidators = {
  // Queries
  [MessageRequests.GetMessage]: yup
    .object({
      messageId: common.entityId,
    })
    .noUnknown()
    .required(),
  [MessageRequests.GetTotalMessages]: null,
  [MessageRequests.GetUserMessages]: yup
    .object({
      userId: common.entityId,
    })
    .noUnknown()
    .required(),
  // Mutations
  [MessageRequests.CreateMessage]: yup
    .object({
      roomId: common.entityId,
      content: common.content,
    })
    .required(),
  [MessageRequests.EditMessage]: yup
    .object({
      messageId: common.entityId,
      content: common.content,
    })
    .noUnknown()
    .required(),
  [MessageRequests.DeleteMessage]: yup
    .object({
      messageId: common.entityId,
    })
    .noUnknown()
    .required(),
  [MessageRequests.ReactToMessage]: yup
    .object({
      messageId: common.entityId,
      reaction: common.reaction,
    })
    .noUnknown()
    .required(),
  [MessageRequests.VoteInMessagePoll]: yup
    .object({
      messageId: common.entityId,
      option: yup.string().required(),
    })
    .noUnknown()
    .required(),
};
