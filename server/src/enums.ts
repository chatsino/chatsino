export type CombinedRequests =
  | UserSocketRequests
  | MessageSocketRequests
  | RoomSocketRequests;

export type CombinedEvents =
  | UserSocketEvents
  | MessageSocketEvents
  | RoomSocketEvents;

export type CombinedSubscriptions = CombinedRequests | CombinedEvents;

export enum BlackjackSocketRequests {
  GetActiveBlackjackGame = "get-active-blackjack-game",
  StartBlackjackGame = "start-blackjack-game",
  TakeBlackjackAction = "take-blackjack-action",
}

export enum ClientSocketRequests {
  ClientTokenExpired = "client-token-expired",
  UserListUpdated = "user-list-updated",
}

export enum ChatroomSocketRequests {
  ListChatrooms = "list-chatrooms",
  ChatroomUpdated = "chatroom-updated",
  ClientEnteredChatroom = "client-entered-chatroom",
  ClientExitedChatroom = "client-exited-chatroom",
}

export enum ChatMessageSocketRequests {
  ListChatroomMessages = "list-chatroom-messages",
  SendChatMessage = "send-chat-message",
  VoteInPoll = "vote-in-poll",
  NewChatMessage = "new-chat-message",
  ChatMessageUpdated = "chat-message-updated",
  ChatMessageDeleted = "chat-message-deleted",
}

export enum ServerMessageSocketRequests {
  ClientSuccessMessage = "client-success-message",
  ClientErrorMessage = "client-error-message",
}

export enum UserSocketRequests {
  // Queries
  GetUser = "get-user",
  GetAllUsers = "get-all-users",
  GetTotalUsers = "get-total-users",
  GetUserByUsername = "get-user-by-username",
  GetUsersByUsernameList = "get-users-by-username-list",
  GetAllModerators = "get-all-moderators",
  GetAllAdministrators = "get-all-administrators",
  GetAllOperators = "get-all-operators",
  GetBannedUsers = "get-banned-users",
  GetCanUserAfford = "get-can-user-afford",
  GetIsCorrectPassword = "get-is-correct-password",

  // Mutations
  CreateUser = "create-user",
  ReassignUser = "reassign-user",
  TempbanUser = "tempban-user",
  PermabanUser = "permaban-user",
  ChargeUser = "charge-user",
  PayUser = "pay-user",
  ChangeUserPassword = "change-user-password",
}

export enum UserSocketEvents {
  UserCreated = "user-created",
  UserChanged = "user-changed",
}

export enum RoomSocketRequests {
  // Queries
  Room = "room",
  AllRooms = "all-rooms",
  AllPublicRooms = "all-public-rooms",
  TotalRooms = "total-rooms",
  RoomByID = "room-by-id",
  RoomByRoomTitle = "room-by-room-title",
  MeetsRoomPermissionRequirement = "meets-room-permission-requirement",
  RoomUsers = "room-users",
  RoomMessages = "room-messages",

  // Mutations
  CreateRoom = "create-room",
  UpdateRoom = "update-room",
  JoinRoom = "join-room",
  LeaveRoom = "leave-room",
  ToggleCoOwner = "toggle-co-owner",
  ToggleBlacklisted = "toggle-blacklisted",
  ToggleWhitelisted = "toggle-whitelisted",
  ToggleMuted = "toggle-muted",
  SendMessage = "send-message",
  SendDirectMessage = "send-direct-message",
  PinMessage = "pin-message",
  RemoveMessage = "remove-message",
  RemoveUserMessages = "remove-user-messages",
}

export enum RoomSocketEvents {
  RoomCreated = "room-created",
  RoomChanged = "room-changed",
}

export enum MessageSocketRequests {
  // Queries
  GetMessage = "get-message",
  GetTotalMessages = "get-total-messages",
  GetUserMessages = "get-user-messages",

  // Mutations
  CreateMessage = "create-message",
  EditMessage = "edit-message",
  DeleteMessage = "delete-message",
  ReactToMessage = "react-to-message",
  VoteInMessagePoll = "vote-in-message-poll",
}

export enum MessageSocketEvents {
  MessageCreated = "message-created",
  MessageChanged = "message-changed",
  MessageDeleted = "message-deleted",
}
