export function groupMessages(messages: ChatsinoMessage[]) {
  const messageGroups = [] as Array<{
    author: ChatsinoUser;
    messages: ChatsinoMessage[];
  }>;

  for (const message of messages) {
    const lastMessageGroup = messageGroups[messageGroups.length - 1] ?? null;

    if (!lastMessageGroup || message.userId !== lastMessageGroup.author.id) {
      messageGroups.push({
        author: message.user as ChatsinoUser,
        messages: [message],
      });

      continue;
    }

    lastMessageGroup.messages.push(message);
  }

  return messageGroups;
}
