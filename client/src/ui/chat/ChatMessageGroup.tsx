import { List, Popover, Space, Typography } from "antd";
import { useClient } from "hooks";
import { ClientAvatarStrip } from "../client";
import { ChatMessage, ChatMessageActions } from "./ChatMessage";
import { groupMessages } from "./group-messages";

export function ChatMessageGroup({
  messageGroup,
  ...messageActions
}: ChatMessageActions & {
  messageGroup: ReturnType<typeof groupMessages>[0];
}) {
  const { client } = useClient();

  return (
    <List.Item style={{ borderTop: "1px solid #424242", position: "relative" }}>
      <List.Item.Meta
        title={
          <Popover
            placement="bottomLeft"
            title={
              <Space>
                {client && (
                  <>
                    <Typography.Text type="secondary">Mention</Typography.Text>
                    <ClientAvatarStrip
                      client={client}
                      size="small"
                      link={false}
                    />
                  </>
                )}
              </Space>
            }
          >
            <div
              role="button"
              style={{ cursor: "pointer", display: "inline-block" }}
              onClick={() =>
                messageActions.onMentionUser(messageGroup.author.username)
              }
            >
              <ClientAvatarStrip client={messageGroup.author} link={false} />
            </div>
          </Popover>
        }
        description={
          <List bordered={false} split={false}>
            {messageGroup.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                {...messageActions}
              />
            ))}
          </List>
        }
      />
    </List.Item>
  );
}
