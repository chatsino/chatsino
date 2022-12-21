import * as yup from "yup";
import { clientSchema } from "./client.schema";

export interface SocketMessage {
  kind: string;
  args: Record<string, unknown>;
}

export interface SourcedSocketMessage extends SocketMessage {
  from: { id: number };
}

// #region Incoming
export const socketRequestSchema = yup.object({
  kind: yup.string().required(),
  args: yup.object().optional().default({}),
});

export const sourcedSocketRequestSchema = socketRequestSchema.shape({
  from: clientSchema.required(),
});

export const clientSubscriptionSchema = yup.object({
  subscription: yup.string().required(),
});
// #endregion

// #region Outgoing
export const socketResponseSchema = yup.object({
  to: yup.number().required(),
  kind: yup.string().required(),
});

export const socketSuccessResponseSchema = socketResponseSchema.shape({
  data: yup.object().nullable().default(undefined),
});

export const socketErrorResponseSchema = socketResponseSchema.shape({
  error: yup.string().required(),
});
// #endregion
