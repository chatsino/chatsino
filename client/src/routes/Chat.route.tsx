import { Col, Row } from "antd";
import { useState } from "react";
import {
  ChatroomGenerator,
  ChatMessageGenerator,
  UserGenerator,
} from "helpers";
import { ChatMessageList, ChatroomList, ChatUserList } from "ui";

export function ChatRoute() {
  const someChatrooms = useChatrooms();
  const someUsers = useChatUsers();
  const someMessages = useChatMessages(someUsers);
  const [messages, setMessages] = useState(someMessages);

  return (
    <Row gutter={12}>
      <Col xs={0} xl={4}>
        <ChatroomList chatrooms={someChatrooms} />
      </Col>
      <Col xs={24} lg={18} xl={16}>
        <ChatMessageList
          id="chat"
          users={someUsers}
          messages={messages}
          onSendMessage={(message) =>
            setMessages((prev) => prev.concat(message))
          }
        />
      </Col>
      <Col xs={0} lg={6} xl={4}>
        <ChatUserList users={someUsers} />
      </Col>
    </Row>
  );
}

function useChatrooms() {
  return ChatroomGenerator.generateChatroomList(30);
}

function useChatMessages(users: ChatUserData[]) {
  return ChatMessageGenerator.generateRealisticChatMessageList(users, 30);
}

function useChatUsers() {
  return UserGenerator.generateChatUserList(30).sort((a, b) =>
    a.username.localeCompare(b.username)
  );
}
