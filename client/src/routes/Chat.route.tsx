import {
  EllipsisOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  List,
  Space,
  Typography,
} from "antd";
import { useEffect, useLayoutEffect, useState } from "react";
import { EmojiDrawer } from "ui";
import sample from "assets/avatars/sample.jpeg";

interface ChatMessage {
  id: number;
  author: {
    id: string;
    avatar: string;
    username: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function ChatRoute() {
  return (
    <div>
      <ChatMessageList />
    </div>
  );
}

export function ChatMessageList() {
  const [messages, setMessage] = useState([] as ChatMessage[]);

  useEffect(() => {
    const chatContainer = document.querySelector(
      "#chat > .ant-spin-nested-loading"
    );

    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

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
            setMessage((prev) =>
              prev.concat({
                id: 1,
                author: {
                  id: "Test Author",
                  avatar: sample,
                  username: "Test Author",
                },
                content: message,
                createdAt: new Date().toString(),
                updatedAt: new Date().toString(),
              })
            )
          }
        />
      }
    />
  );
}

export function ChatInput({
  onSend,
}: {
  onSend: (message: string) => unknown;
}) {
  const [form] = Form.useForm();
  const [showingEmojiDrawer, setShowingEmojiDrawer] = useState(false);

  function toggleEmojiDrawer() {
    setShowingEmojiDrawer((prev) => !prev);
  }

  function closeEmojiDrawer() {
    setShowingEmojiDrawer(false);
  }

  function handleFinish(values: { draft: string }) {
    form.setFieldValue("draft", "");
    return onSend(values.draft);
  }

  return (
    <>
      <Form form={form} initialValues={{ draft: "" }} onFinish={handleFinish}>
        <Input.Group compact={true}>
          <Form.Item name="draft" noStyle={true}>
            <Input.TextArea
              autoFocus={true}
              style={{ width: "calc(100% - 35px)", height: 70 }}
              onKeyUp={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  form.submit();
                }
              }}
            />
          </Form.Item>
          <Space direction="vertical">
            <Button
              icon={<SmileOutlined />}
              size="large"
              style={{ borderRadius: 0 }}
              onClick={toggleEmojiDrawer}
            />
            <Button
              icon={<SendOutlined />}
              type="primary"
              size="large"
              style={{ borderRadius: 0 }}
              htmlType="submit"
            />
          </Space>
        </Input.Group>
      </Form>
      {showingEmojiDrawer && <EmojiDrawer onClose={closeEmojiDrawer} />}
    </>
  );
}
