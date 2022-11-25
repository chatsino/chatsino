import * as yup from "yup";
import { SafeClient, clientSchema } from "./client.schema";

export interface SocketMessage {
  kind: string;
  args: Record<string, unknown>;
}

export interface SourcedSocketMessage extends SocketMessage {
  from: SafeClient;
}

// #region Incoming
export const socketMessageSchema = yup.object({
  kind: yup.string().required(),
  args: yup.object().optional().default({}),
});

export const sourcedSocketMessageSchema = socketMessageSchema.shape({
  from: clientSchema.required(),
});
// #endregion

// #region Outgoing
export const socketResponseSchema = yup.object({
  to: yup.number().required(),
  kind: yup.string().required(),
});

export const socketSuccessResponseSchema = socketResponseSchema.shape({
  data: yup.object().nullable(),
});

export const socketErrorResponseSchema = socketResponseSchema.shape({
  error: yup.string().required(),
});
// #endregion
