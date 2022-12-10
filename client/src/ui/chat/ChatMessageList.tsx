import { EllipsisOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, List, Typography } from "antd";
import { ChatMessageGenerator } from "helpers";
import { useChatAutoscroll } from "hooks";
import { ChatInput } from "./ChatInput";

export function ChatMessageList({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => unknown;
}) {
  useChatAutoscroll(messages);

  return (
    <List
      id="chat"
      dataSource={messages}
      itemLayout="vertical"
      renderItem={(item) => (
        <List.Item
          key={item.id}
          extra={
            <Typography.Text>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "reply",
                      label: "Reply",
                    },
                    {
                      key: "delete",
                      label: (
                        <Typography.Text type="danger">Delete</Typography.Text>
                      ),
                    },
                  ],
                  onClick: (item) => console.info(item),
                }}
              >
                <Button
                  type="text"
                  icon={
                    <Typography.Text>
                      <EllipsisOutlined />
                    </Typography.Text>
                  }
                />
              </Dropdown>
            </Typography.Text>
          }
        >
          <List.Item.Meta
            avatar={<Avatar src={item.author.avatar} />}
            title={
              <div>
                <Typography.Title level={5}>
                  {item.author.username}
                </Typography.Title>
              </div>
            }
            description={<Typography.Text>{item.content}</Typography.Text>}
          />
        </List.Item>
      )}
      style={{
        height: "85vh",
        overflow: "auto",
      }}
      footer={
        <ChatInput
          onSend={(message) =>
            onSendMessage(
              ChatMessageGenerator.generateChatMessage({
                author: {
                  username: "Bob Johnson",
                },
                content: message,
              })
            )
          }
        />
      }
    />
  );
}
