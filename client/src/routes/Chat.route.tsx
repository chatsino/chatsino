import { useState } from "react";
import { ChatMessageGenerator } from "helpers";
import { ChatMessageList } from "ui";
import { Col, Row } from "antd";

export function ChatRoute() {
  const someMessages = useChatMessages();
  const [messages, setMessages] = useState(someMessages);

  return (
    <Row>
      <Col span={24}>
        <ChatMessageList
          id="chat"
          messages={messages}
          onSendMessage={(message) =>
            setMessages((prev) => prev.concat(message))
          }
        />
      </Col>
    </Row>
  );
}

function useChatMessages() {
  return ChatMessageGenerator.generateRealisticChatMessageList(30);
}
