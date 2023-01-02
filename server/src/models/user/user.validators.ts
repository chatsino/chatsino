import * as config from "config";
import * as yup from "yup";
import { UserSocketRequests } from "./user.subscriptions";
import { UserRole } from "./user.types";

export const USER_ROLE_RANKING: UserRole[] = [
  "user",
  "moderator",
  "administrator",
  "operator",
];

const common = {
  userId: yup.string().required(),
  username: yup.string().required(),
  avatar: yup.string().required(),
  password: yup.string().min(config.MINIMUM_PASSWORD_SIZE).required(),
  positiveAmount: yup.number().min(1).positive().required(),
};

const userCharge = {
  userId: common.userId,
  amount: common.positiveAmount,
};

export const userValidators = {
  // Queries
  [UserSocketRequests.GetUser]: yup
    .object({
      userId: common.userId,
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.GetAllUsers]: null,
  [UserSocketRequests.GetTotalUsers]: null,
  [UserSocketRequests.GetUserByUsername]: yup
    .object({
      username: common.username,
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.GetUsersByUsernameList]: yup
    .object({
      usernames: yup.array(common.username).required(),
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.GetAllModerators]: null,
  [UserSocketRequests.GetAllAdministrators]: null,
  [UserSocketRequests.GetAllOperators]: null,
  [UserSocketRequests.GetBannedUsers]: null,
  [UserSocketRequests.GetCanUserAfford]: yup
    .object(userCharge)
    .noUnknown()
    .required(),
  [UserSocketRequests.GetIsCorrectPassword]: yup
    .object({
      userId: common.userId,
      password: common.password,
    })
    .noUnknown()
    .required(),

  // Mutations
  [UserSocketRequests.CreateUser]: yup
    .object({
      avatar: common.avatar,
      username: common.username,
      password: common.password,
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.ReassignUser]: yup
    .object({
      userId: common.userId,
      role: yup
        .string()
        .test({
          name: "User Role",
          test: (value) =>
            Boolean(value && USER_ROLE_RANKING.includes(value as UserRole)),
        })
        .required(),
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.TempbanUser]: yup
    .object({
      userId: common.userId,
      duration: common.positiveAmount,
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.PermabanUser]: yup
    .object({
      userId: common.userId,
    })
    .noUnknown()
    .required(),
  [UserSocketRequests.ChargeUser]: yup
    .object(userCharge)
    .noUnknown()
    .required(),
  [UserSocketRequests.PayUser]: yup.object(userCharge).noUnknown().required(),
  [UserSocketRequests.ChangeUserPassword]: yup
    .object({
      userId: common.userId,
      password: common.password,
    })
    .noUnknown()
    .required(),
};
