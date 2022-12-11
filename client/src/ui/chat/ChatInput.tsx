import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Button, Form, Input, Space } from "antd";
import { useEffect, useState } from "react";
import { EmojiDrawer } from "ui";

export function ChatInput({
  onDrawerOpen,
  onDrawerClose,
  onSend,
}: {
  onDrawerOpen?: () => unknown;
  onDrawerClose?: () => unknown;
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

  useEffect(() => {
    if (showingEmojiDrawer) {
      onDrawerOpen?.();
    } else {
      onDrawerClose?.();
    }
  }, [showingEmojiDrawer, onDrawerOpen, onDrawerClose]);

  return (
    <>
      <Form form={form} initialValues={{ draft: "" }} onFinish={handleFinish}>
        <Input.Group compact={true}>
          <Form.Item name="draft" noStyle={true}>
            <Input.TextArea
              autoFocus={true}
              style={{ width: "calc(100% - 35px)", height: 70 }}
              onBlur={closeEmojiDrawer}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
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
