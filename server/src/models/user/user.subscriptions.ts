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
