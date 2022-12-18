import { Avatar, List, Typography } from "antd";
import { useClient } from "hooks";
import { BsPinAngle } from "react-icons/bs";
import { ChatMessageMenu } from "./ChatMessageMenu";
import { formatMessageTimestamp } from "./format-message-timestamp";
import { groupMessages } from "./group-messages";

export function ChatMessageGroup({
  messageGroup,
  onMentionUser,
  onPinMessage,
  onDeleteMessage,
}: {
  messageGroup: ReturnType<typeof groupMessages>[0];
  onMentionUser: (username: string) => unknown;
  onPinMessage: (messageId: number) => unknown;
  onDeleteMessage: (messageId: number) => unknown;
}) {
  const { client } = useClient();
  const mentionsClient = (message: ChatMessageData) => {
    const mention = `@${client?.username} `;
    const startsWithMention = message.content.startsWith(mention);
    const includesMention = new RegExp(` ${mention}`).test(message.content);

    return Boolean(client && (startsWithMention || includesMention));
  };

  return (
    <List.Item
      style={{ borderBottom: "1px solid #424242", position: "relative" }}
    >
      <List.Item.Meta
        avatar={<Avatar src={messageGroup.author.avatar} />}
        title={messageGroup.author.username}
        description={
          <List bordered={false} split={false}>
            {messageGroup.messages.map((message) => (
              <List.Item
                key={message.id}
                style={{
                  position: "relative",
                  background: mentionsClient(message) ? "#33333388" : "initial",
                }}
                extra={
                  <div style={{ position: "absolute", top: 0, right: 0 }}>
                    {message.pinned && <BsPinAngle />}
                    <ChatMessageMenu
                      message={message}
                      onMention={onMentionUser}
                      onPin={onPinMessage}
                      onDelete={onDeleteMessage}
                    />
                  </div>
                }
              >
                <List.Item.Meta
                  title={
                    <Typography.Paragraph
                      key={message.id}
                      style={{ marginRight: "1rem" }}
                    >
                      {message.content}
                    </Typography.Paragraph>
                  }
                  description={
                    <Typography.Text
                      type="secondary"
                      style={{ display: "block", textAlign: "right" }}
                    >
                      <em>{formatMessageTimestamp(message)}</em>
                    </Typography.Text>
                  }
                />
              </List.Item>
            ))}
          </List>
        }
      />
    </List.Item>
  );
}
