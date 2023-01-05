import * as config from "config";
import { UserRole, USER_ROLE_RANKING } from "entities";
import * as yup from "yup";
import { UserRequests } from "./user.requests";

const common = {
  userId: yup.string().required(),
  username: yup.string().required(),
  avatar: yup.string().required(),
  password: yup.string().min(config.MINIMUM_PASSWORD_SIZE).required(),
  positiveAmount: yup.number().min(1).positive().required(),
};

const userModification = {
  modifyingUserId: common.userId,
  modifiedUserId: common.userId,
};

const userCharge = {
  userId: common.userId,
  amount: common.positiveAmount,
};

export const userValidators = {
  // Queries
  [UserRequests.GetUser]: yup
    .object({
      userId: common.userId,
    })
    .noUnknown()
    .required(),
  [UserRequests.GetAllUsers]: null,
  [UserRequests.GetTotalUsers]: null,
  [UserRequests.GetUserByUsername]: yup
    .object({
      username: common.username,
    })
    .noUnknown()
    .required(),
  [UserRequests.GetUsersWithUsername]: yup
    .object({
      username: common.username,
    })
    .noUnknown()
    .required(),
  [UserRequests.GetUsersByUsernameList]: yup
    .object({
      usernames: yup.array(common.username).required(),
    })
    .noUnknown()
    .required(),
  [UserRequests.GetAllModerators]: null,
  [UserRequests.GetAllAdministrators]: null,
  [UserRequests.GetAllOperators]: null,
  [UserRequests.GetBannedUsers]: null,
  [UserRequests.GetCanUserAfford]: yup
    .object(userCharge)
    .noUnknown()
    .required(),
  [UserRequests.GetIsCorrectPassword]: yup
    .object({
      userId: common.userId,
      password: common.password,
    })
    .noUnknown()
    .required(),

  // Mutations
  [UserRequests.CreateUser]: yup
    .object({
      avatar: common.avatar,
      username: common.username,
      password: common.password,
    })
    .noUnknown()
    .required(),
  [UserRequests.ReassignUser]: yup
    .object({
      ...userModification,
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
  [UserRequests.TempbanUser]: yup
    .object({
      ...userModification,
      duration: common.positiveAmount,
    })
    .noUnknown()
    .required(),
  [UserRequests.PermabanUser]: yup
    .object(userModification)
    .noUnknown()
    .required(),
  [UserRequests.ChargeUser]: yup.object(userCharge).noUnknown().required(),
  [UserRequests.PayUser]: yup.object(userCharge).noUnknown().required(),
  [UserRequests.ChangeUserPassword]: yup
    .object({
      ...userModification,
      password: common.password,
    })
    .noUnknown()
    .required(),
};
