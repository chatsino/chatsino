import * as config from "config";
import * as yup from "yup";

export type ClientPermissionLevel =
  | "visitor"
  | "user"
  | "admin:limited"
  | "admin:unlimited";

export interface SafeClient {
  id: number;
  avatar: string;
  username: string;
  permissionLevel: ClientPermissionLevel;
  chips: number;
  createdAt: string;
  updatedAt: string;
}

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
  chips: yup.number().positive().required(),
  createdAt: yup.date().required(),
  updatedAt: yup.date().required(),
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

export const purchaseChipsSchema = yup.object({
  amount: yup.number().min(5).required(),
  paymentMethod: yup.string().oneOf(["charity"]).required(),
});
