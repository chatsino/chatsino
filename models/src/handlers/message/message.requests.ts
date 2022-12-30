export enum MessageRequests {
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
