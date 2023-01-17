import * as config from "config";
import { RoomPermission } from "entities";
import * as yup from "yup";
import { RoomRequests } from "./room.requests";

const common = {
  entityId: yup.string().required(),
  avatar: yup.string().required(),
  title: yup.string().min(3).required(),
  description: yup.string().min(4).required(),
  password: yup.string().min(config.MINIMUM_PASSWORD_SIZE).required(),
  optionalPassword: yup.string().min(config.MINIMUM_PASSWORD_SIZE).optional(),
  optionalBoolean: yup.boolean().optional().default(false),
  content: yup.string().min(1).required(),
};

const modification = {
  roomId: common.entityId,
  modifiedUserId: common.entityId,
};

export const roomValidators = {
  // Queries
  [RoomRequests.Room]: yup
    .object({
      roomId: common.entityId,
      hydrate: common.optionalBoolean,
    })
    .noUnknown()
    .required(),
  [RoomRequests.AllRooms]: null,
  [RoomRequests.AllPublicRooms]: null,
  [RoomRequests.TotalRooms]: null,
  [RoomRequests.RoomByID]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomRequests.RoomByRoomTitle]: yup
    .object({
      title: common.title,
    })
    .noUnknown()
    .required(),
  [RoomRequests.MeetsRoomPermissionRequirement]: yup
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
  [RoomRequests.RoomUsers]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomRequests.RoomMessages]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),

  // Mutations
  [RoomRequests.CreateRoom]: yup
    .object({
      avatar: common.avatar,
      title: common.title,
      description: common.description,
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomRequests.UpdateRoom]: yup
    .object({
      roomId: common.entityId,
      avatar: yup.string().optional(),
      title: yup.string().min(3).optional(),
      description: yup.string().min(4).optional(),
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomRequests.JoinRoom]: yup
    .object({
      roomId: common.entityId,
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomRequests.LeaveRoom]: yup
    .object({
      roomId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomRequests.ToggleCoOwner]: yup.object(modification).noUnknown().required(),
  [RoomRequests.ToggleBlacklisted]: yup
    .object(modification)
    .noUnknown()
    .required(),
  [RoomRequests.ToggleWhitelisted]: yup
    .object(modification)
    .noUnknown()
    .required(),
  [RoomRequests.ToggleMuted]: yup.object(modification).noUnknown().required(),
  [RoomRequests.SendMessage]: yup
    .object({
      roomId: common.entityId,
      content: common.content,
      password: common.optionalPassword,
    })
    .noUnknown()
    .required(),
  [RoomRequests.SendDirectMessage]: yup
    .object({
      receivingUserId: common.entityId,
      content: common.content,
    })
    .noUnknown()
    .required(),
  [RoomRequests.PinMessage]: yup
    .object({
      roomId: common.entityId,
      messageId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomRequests.RemoveMessage]: yup
    .object({
      roomId: common.entityId,
      messageId: common.entityId,
    })
    .noUnknown()
    .required(),
  [RoomRequests.RemoveUserMessages]: yup
    .object({
      roomId: common.entityId,
      userId: common.entityId,
    })
    .noUnknown()
    .required(),
};
