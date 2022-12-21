export enum ClientSocketRequests {
  ClientTokenExpired = "client-token-expired",
  ClientEnteredChatroom = "client-entered-chatroom",
  ClientExitedChatroom = "client-exited-chatroom",
}

export enum ChatroomSocketRequests {
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",
  SendChatMessage = "send-chat-message",
  VoteInPoll = "vote-in-poll",
  NewChatMessage = "new-chat-message",
}

export enum ServerMessageSocketRequests {
  ClientSuccessMessage = "client-success-message",
  ClientErrorMessage = "client-error-message",
}

export enum BlackjackSocketRequests {
  GetActiveBlackjackGame = "get-active-blackjack-game",
  StartBlackjackGame = "start-blackjack-game",
  TakeBlackjackAction = "take-blackjack-action",
}
