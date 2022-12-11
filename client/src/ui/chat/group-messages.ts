export function groupMessages(messages: ChatMessageData[]) {
  const messageGroups = [] as Array<{
    author: ChatMessageData["author"];
    messages: ChatMessageData[];
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
