import { Avatar, List, Typography } from "antd";
import { ChatMessageMenu } from "./ChatMessageMenu";
import { formatMessageTimestamp } from "./format-message-timestamp";
import { groupMessages } from "./group-messages";

export function ChatMessageGroup({
  messageGroup,
  onDeleteMessage,
}: {
  messageGroup: ReturnType<typeof groupMessages>[0];
  onDeleteMessage: (messageId: number) => unknown;
}) {
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
                style={{ position: "relative" }}
                extra={
                  <div style={{ position: "absolute", top: 0, right: 0 }}>
                    <ChatMessageMenu
                      message={message}
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
