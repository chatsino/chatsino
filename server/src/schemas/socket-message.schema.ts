import * as yup from "yup";
import { clientSchema } from "./client.schema";

export const socketMessageSchema = yup.object({
  kind: yup.string().required(),
  args: yup.object().optional().default({}),
});

export const sourcedSocketMessageSchema = socketMessageSchema.shape({
  from: clientSchema.required(),
});
