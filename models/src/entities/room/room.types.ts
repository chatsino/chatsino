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
