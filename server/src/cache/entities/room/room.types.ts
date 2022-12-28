export type OwnerPermissionMarker = "O";
export type CoOwnerPermissionMarker = "C";
export type GuestPermissionMarker = "G"; // Not stored, only used for checks.
export type TalkPermissionMarker = "T"; // Not stored, only used for checks.
export type MutedPermissionMarker = "M";
export type BlacklistedPermissionMarker = "B";
export type WhitelistedPermissionMarker = "W";

export type PermissionMarker =
  | OwnerPermissionMarker
  | CoOwnerPermissionMarker
  | GuestPermissionMarker
  | TalkPermissionMarker
  | MutedPermissionMarker
  | BlacklistedPermissionMarker
  | WhitelistedPermissionMarker;

export type OnlyPermissionMarker<S> = S extends ""
  ? unknown
  : S extends `${PermissionMarker}${infer Tail}`
  ? OnlyPermissionMarker<Tail>
  : never;

export enum RoomPermission {
  Owner = "O",
  CoOwner = "C",
  Guest = "G",
  Talk = "T",
  Muted = "M",
  Blacklisted = "B",
  Whitelisted = "W",
}

export type RoomUserPermissions = Record<RoomPermission, boolean>;

export type RoomPermissionLookup = Record<string, RoomUserPermissions>;

export type RoomCreate = {
  ownerId: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
};

export class RoomIncorrectPasswordError extends Error {
  statusCode = 401;
  message = "That is the wrong password.";
}

export class RoomNotAllowedError extends Error {
  statusCode = 401;
  message = "User is not allowed in that room.";
}

export class RoomForbiddenActionError extends Error {
  statusCode = 403;
  message = "User cannot perform that action.";
}

export class RoomForbiddenModificationError extends Error {
  statusCode = 403;
  message = "User cannot modify that room.";
}

export class RoomNotFoundError extends Error {
  statusCode = 404;
  message = "That room does not exist.";
}

export class RoomMessageNotFoundError extends Error {
  statusCode = 404;
  message = "That message does not exist in that room.";
}

export class RoomTitleConflictError extends Error {
  statusCode = 409;
  message = "That room title is already in use.";
}
