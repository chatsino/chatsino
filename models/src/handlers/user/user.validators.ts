import * as yup from "yup";
import { UserRequests } from "./user.requests";

export const userValidators = {
  [UserRequests.GetUser]: yup
    .object({
      userId: yup.string().required(),
    })
    .noUnknown()
    .required(),
};
