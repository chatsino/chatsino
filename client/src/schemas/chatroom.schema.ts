import * as yup from "yup";

export const joinPrivateRoomSchema = yup.object({
  room: yup.string().min(1).required(),
  password: yup.string().optional().default(""),
});
