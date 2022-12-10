import { EllipsisOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown, List, Typography } from "antd";
import { ChatMessageGenerator } from "helpers";
import { useChatAutoscroll } from "hooks";
import { useState } from "react";
import { ChatInput } from "./ChatInput";

export const THIRTY_PERCENT = "calc(var(--vh, 1vh) * 30";
export const EIGHTY_FIVE_PERCENT = "calc(var(--vh, 1vh) * 85";

export function ChatMessageList({
  id,
  messages,
  onSendMessage,
}: {
  id: string;
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => unknown;
}) {
  const [raised, setRaised] = useState(false);

  useChatAutoscroll(id, messages);

  return (
    <List
      id={id}
      dataSource={messages}
      itemLayout="vertical"
      header={
        <div>
          <Typography.Title level={5}>#room</Typography.Title>
        </div>
      }
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
        height: raised ? THIRTY_PERCENT : EIGHTY_FIVE_PERCENT,
        overflow: "auto",
      }}
      footer={
        <ChatInput
          onDrawerOpen={() => setRaised(true)}
          onDrawerClose={() => setRaised(false)}
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
