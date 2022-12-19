import { List, Popover, Typography } from "antd";
import { useClient } from "hooks";
import { BsPinAngle } from "react-icons/bs";
import { SafeClient } from "schemas";
import { ChatMessageMenu } from "./ChatMessageMenu";

export type ChatMessageActions = {
  onMentionUser: (username: string) => unknown;
  onPinMessage: (messageId: number) => unknown;
  onDeleteMessage: (messageId: number) => unknown;
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
  message: ChatMessageData,
  client: null | SafeClient
) => {
  const mention = `@${client?.username} `;
  const startsWithMention = message.content.startsWith(mention);
  const includesMention = new RegExp(` ${mention}`).test(message.content);

  return Boolean(client && (startsWithMention || includesMention));
};

export function ChatMessage({
  message,
  onMentionUser,
  onPinMessage,
  onDeleteMessage,
}: ChatMessageActions & { message: ChatMessageData }) {
  const { client } = useClient();

  return (
    <List.Item
      key={message.id}
      className={getMessageBackgroundClass(
        message.pinned,
        mentionsClient(message, client)
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
      {message.pinned && (
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
