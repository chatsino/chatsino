import { List, Popover, Typography } from "antd";
import { useClient } from "hooks";
import { BsPinAngle } from "react-icons/bs";
import { ChatMessageMenu } from "./ChatMessageMenu";

export type ChatMessageActions = {
  onMentionUser: (username: string) => unknown;
  onPinMessage: (messageId: string) => unknown;
  onDeleteMessage: (messageId: string) => unknown;
};

export const getMessageBackgroundClass = (
  isPinned: boolean,
  isMention: boolean
) => {
  if (isPinned && isMention) {
    return "animation__shimmer__purple";
  }

  if (isPinned) {
    return "animation__shimmer__red";
  }

  if (isMention) {
    return "animation__shimmer__blue";
  }

  return "";
};

export const mentionsClient = (
  message: ChatsinoMessage,
  client: ChatsinoUser
) => message.mentions.includes(client.username);

export function ChatMessage({
  message,
  onMentionUser,
  onPinMessage,
  onDeleteMessage,
}: ChatMessageActions & { message: ChatsinoMessage }) {
  const { client } = useClient();

  return (
    <List.Item
      key={message.id}
      className={getMessageBackgroundClass(
        false,
        // message.pinned,
        Boolean(client && mentionsClient(message, client))
      )}
      style={{
        position: "relative",
        borderRadius: 8,
      }}
      extra={
        <div style={{ position: "absolute", top: 0, right: 0 }}>
          <ChatMessageMenu
            message={message}
            onMention={onMentionUser}
            onPin={onPinMessage}
            onDelete={onDeleteMessage}
          />
        </div>
      }
    >
      {false && (
        // {message.pinned && (
        <Popover content="Pinned.">
          <Typography.Text
            type="danger"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              fontSize: 10,
              transform: "rotateY(180deg)",
            }}
          >
            <BsPinAngle />
          </Typography.Text>
        </Popover>
      )}
      <List.Item.Meta
        description={
          <Typography.Paragraph
            key={message.id}
            style={{ marginRight: "1rem" }}
          >
            {message.content}
          </Typography.Paragraph>
        }
      />
    </List.Item>
  );
}
