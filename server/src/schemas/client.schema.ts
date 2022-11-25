import * as yup from "yup";

export type ClientPermissionLevel =
  | "visitor"
  | "user"
  | "admin:limited"
  | "admin:unlimited";

export interface Client {
  id: number;
  username: string;
  permissionLevel: ClientPermissionLevel;
  chips: number;
  hash: string;
  salt: string;
}

export type SafeClient = Omit<Client, "hash" | "salt">;

export interface AuthenticatedClient {
  id: number;
  username: string;
  permissionLevel: ClientPermissionLevel;
}

export const clientPermissionLevelSchema = yup
  .string()
  .oneOf(["visitor", "user", "admin:limited", "admin:unlimited"]);

export const clientSchema = yup.object({
  id: yup.number().required(),
  username: yup.string().required(),
  permissionLevel: clientPermissionLevelSchema.required(),
  chips: yup.number().positive().required(),
});
