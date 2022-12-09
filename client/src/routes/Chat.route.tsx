import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, Typography } from "antd";
import { useState } from "react";
import { EmojiDrawer } from "ui";

export function ChatRoute() {
  const [messages, setMessage] = useState([] as string[]);

  return (
    <div>
      {messages.map((message) => (
        <Typography.Text>{message}</Typography.Text>
      ))}
      <Divider />
      <ChatInput
        onSend={(message) => setMessage((prev) => prev.concat(message))}
      />
    </div>
  );
}

export function ChatInput({
  onSend,
}: {
  onSend: (message: string) => unknown;
}) {
  const [showingEmojiDrawer, setShowingEmojiDrawer] = useState(false);

  function toggleEmojiDrawer() {
    setShowingEmojiDrawer((prev) => !prev);
  }

  function closeEmojiDrawer() {
    setShowingEmojiDrawer(false);
  }

  function handleFinish(values: { draft: string }) {
    return onSend(values.draft);
  }

  return (
    <>
      <Form initialValues={{ draft: "" }} onFinish={handleFinish}>
        <Input.Group compact={true}>
          <Form.Item name="draft" noStyle={true}>
            <Input
              autoFocus={true}
              style={{ width: "calc(100% - 80px)" }}
              size="large"
            />
          </Form.Item>
          <Button
            icon={<SmileOutlined />}
            size="large"
            onClick={toggleEmojiDrawer}
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            size="large"
          />
        </Input.Group>
      </Form>
      {showingEmojiDrawer && <EmojiDrawer onClose={closeEmojiDrawer} />}
    </>
  );
}
