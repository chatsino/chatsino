import * as config from "config";
import type { ClientPermissionLevel } from "persistence";
import * as yup from "yup";

export const PASSWORD_MESSAGE = `A password must include a minimum of ${config.MINIMUM_PASSWORD_SIZE} characters.`;

export const PERMISSION_RANKING: ClientPermissionLevel[] = [
  "visitor",
  "user",
  "admin:limited",
  "admin:unlimited",
];

export const clientPermissionLevelSchema = yup
  .string()
  .oneOf(PERMISSION_RANKING);

export const clientSchema = yup.object({
  id: yup.number().required(),
  username: yup.string().required(),
  permissionLevel: clientPermissionLevelSchema.required(),
  chips: yup.number().min(0).required(),
  createdAt: yup.string().required(),
  updatedAt: yup.string().required(),
});

export const clientSigninSchema = yup.object({
  username: yup.string().required("A username is required."),
  password: yup
    .string()
    .min(config.MINIMUM_PASSWORD_SIZE, PASSWORD_MESSAGE)
    .required(PASSWORD_MESSAGE),
});

export const clientSignupSchema = clientSigninSchema.shape({
  passwordAgain: yup
    .string()
    .min(config.MINIMUM_PASSWORD_SIZE, PASSWORD_MESSAGE)
    .test({
      name: "match",
      exclusive: false,
      message: "Passwords must match.",
      test: (value, context) => value === context.parent.password,
    })
    .required("Please re-enter your chosen password."),
});
