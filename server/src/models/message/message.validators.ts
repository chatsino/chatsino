import * as yup from "yup";
import { MessageSocketRequests } from "./message.types";

const common = {
  entityId: yup.string().required(),
  content: yup.string().min(1).required(),
  reaction: yup.string().required(),
};

export const messageValidators = {
  // Queries
  [MessageSocketRequests.GetMessage]: yup
    .object({
      messageId: common.entityId,
    })
    .noUnknown()
    .required(),
  [MessageSocketRequests.GetTotalMessages]: null,
  [MessageSocketRequests.GetUserMessages]: yup
    .object({
      userId: common.entityId,
    })
    .noUnknown()
    .required(),
  // Mutations
  [MessageSocketRequests.CreateMessage]: yup
    .object({
      roomId: common.entityId,
      content: common.content,
    })
    .required(),
  [MessageSocketRequests.EditMessage]: yup
    .object({
      content: common.content,
    })
    .noUnknown()
    .required(),
  [MessageSocketRequests.DeleteMessage]: null,
  [MessageSocketRequests.ReactToMessage]: yup
    .object({
      messageId: common.entityId,
      reaction: common.reaction,
    })
    .noUnknown()
    .required(),
  [MessageSocketRequests.VoteInMessagePoll]: yup
    .object({
      option: yup.string().required(),
    })
    .noUnknown()
    .required(),
};
