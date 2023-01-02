import * as config from "config";
import * as yup from "yup";
import { RoomPermission, RoomSocketRequests } from "./room.types";

const common = {
  entityId: yup.string().required(),
  avatar: yup.string().required(),
  title: yup.string().min(3).required(),
  description: yup.string().min(4).required(),
  password: yup.string().min(config.MINIMUM_PASSWORD_SIZE).required(),
  optionalPassword: yup.string().min(config.MINIMUM_PASSWORD_SIZE).optional(),
  content: yup.string().min(1).required(),
};

const modification = {
  roomId: common.entityId,
  modifiedUserId: common.entityId,
};

export const roomValidators = {
  // Queries
  [RoomSocketRequests.Room]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.AllRooms]: null,
  [RoomSocketRequests.AllPublicRooms]: null,
  [RoomSocketRequests.TotalRooms]: null,
  [RoomSocketRequests.RoomByID]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.RoomByRoomTitle]: yup
    .object({
      title: common.title,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.MeetsRoomPermissionRequirement]: yup
    .object({
      roomId: common.entityId,
      userId: common.entityId,
      requirement: yup
        .string()
        .test({
          name: "Permission Marker",
          test: (value) =>
            Boolean(
              value &&
                Object.values(RoomPermission).includes(value as RoomPermission)
            ),
        })
        .required(),
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.RoomUsers]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.RoomMessages]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),

  // Mutations
  [RoomSocketRequests.CreateRoom]: yup
    .object({
      ownerId: common.entityId,
      avatar: common.avatar,
      title: common.title,
      description: common.description,
      password: common.password,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.UpdateRoom]: yup
    .object({
      roomId: common.entityId,
      avatar: yup.string().optional(),
      title: yup.string().min(3).optional(),
      description: yup.string().min(4).optional(),
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.JoinRoom]: yup
    .object({
      roomId: common.entityId,
      userId: common.entityId,
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.LeaveRoom]: yup
    .object({
      roomId: common.entityId,
      userId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.ToggleCoOwner]: yup
    .object(modification)
    .noUnknown()
    .required(),
  [RoomSocketRequests.ToggleBlacklisted]: yup
    .object(modification)
    .noUnknown()
    .required(),
  [RoomSocketRequests.ToggleWhitelisted]: yup
    .object(modification)
    .noUnknown()
    .required(),
  [RoomSocketRequests.ToggleMuted]: yup
    .object(modification)
    .noUnknown()
    .required(),
  [RoomSocketRequests.SendMessage]: yup
    .object({
      roomId: common.entityId,
      content: common.content,
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.SendDirectMessage]: yup
    .object({
      sendingUserId: common.entityId,
      receivingUserId: common.entityId,
      content: common.content,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.PinMessage]: null,
  [RoomSocketRequests.RemoveMessage]: yup
    .object({
      roomId: common.entityId,
      userId: common.entityId,
      messageId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomSocketRequests.RemoveUserMessages]: yup
    .object({
      roomId: common.entityId,
      userId: common.entityId,
    })
    .noUnknown()
    .required(),
};
