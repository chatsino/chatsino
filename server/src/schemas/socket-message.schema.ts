import * as yup from "yup";
import { SafeClient, clientSchema } from "./client.schema";

export interface SocketMessage {
  kind: string;
  args: Record<string, unknown>;
}

export interface SourcedSocketMessage extends SocketMessage {
  from: SafeClient;
}

export const socketMessageSchema = yup.object({
  kind: yup.string().required(),
  args: yup.object().optional().default({}),
});

export const sourcedSocketMessageSchema = socketMessageSchema.shape({
  from: clientSchema.required(),
});
