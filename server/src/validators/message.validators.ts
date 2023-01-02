import { MessageSocketRequests } from "enums";
import * as yup from "yup";

export interface Message {
  id: string;
  userId: string;
  roomId: string;
  createdAt: string;
  changedAt: string;
  content: string;
  reactions: string[];
  poll: string[];
  mentions: string[];
}

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
