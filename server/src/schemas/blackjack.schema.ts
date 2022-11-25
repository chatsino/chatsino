import * as yup from "yup";

export const getActiveBlackjackGameSchema = yup
  .object({
    clientId: yup.number().required(),
  })
  .required();

export const startBlackjackGameActionSchema = yup
  .object({
    wager: yup.number().positive().required(),
  })
  .required();

export const takeBlackjackActionSchema = yup
  .object({
    action: yup
      .string()
      .oneOf(["hit", "stay", "double-down", "buy-insurance"])
      .required(),
  })
  .required();
