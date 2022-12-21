export enum BlackjackSocketRequests {
  GetActiveBlackjackGame = "get-active-blackjack-game",
  StartBlackjackGame = "start-blackjack-game",
  TakeBlackjackAction = "take-blackjack-action",
}

export enum ClientSocketRequests {
  ClientTokenExpired = "client-token-expired",
  ClientEnteredChatroom = "client-entered-chatroom",
  ClientExitedChatroom = "client-exited-chatroom",
}

export enum ChatroomSocketRequests {
  ListChatrooms = "list-chatrooms",
  ChatroomUpdated = "chatroom-updated",
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
