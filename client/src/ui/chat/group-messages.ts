export function groupMessages(messages: ChatMessage[]) {
  const messageGroups = [] as Array<{
    author: ChatMessage["author"];
    messages: ChatMessage[];
  }>;

  for (const message of messages) {
    const lastMessageGroup = messageGroups[messageGroups.length - 1] ?? null;

    if (!lastMessageGroup || message.author.id !== lastMessageGroup.author.id) {
      messageGroups.push({
        author: message.author,
        messages: [message],
      });
      continue;
    }

    lastMessageGroup.messages.push(message);
  }

  return messageGroups;
}
