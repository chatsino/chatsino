import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { Button, Divider, Input } from "antd";
import { useState } from "react";
import { EmojiDrawer } from "ui";

export function ChatRoute() {
  return (
    <div>
      <Divider />
      <ChatInput />
    </div>
  );
}

export function ChatInput() {
  const [showingEmojiDrawer, setShowingEmojiDrawer] = useState(false);

  function toggleEmojiDrawer() {
    setShowingEmojiDrawer((prev) => !prev);
  }

  function closeEmojiDrawer() {
    setShowingEmojiDrawer(false);
  }

  return (
    <>
      <Input.Group compact={true}>
        <Input
          type="text"
          autoFocus={true}
          placeholder="Send a message..."
          style={{ width: "75%" }}
          size="large"
        />
        <Button
          icon={<SmileOutlined />}
          size="large"
          onClick={toggleEmojiDrawer}
        />
        <Button icon={<SendOutlined />} size="large" />
      </Input.Group>
      {showingEmojiDrawer && <EmojiDrawer onClose={closeEmojiDrawer} />}
    </>
  );
}
