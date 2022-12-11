import { Col, Divider, Row } from "antd";
import { useState } from "react";
import {
  ChatroomGenerator,
  ChatMessageGenerator,
  UserGenerator,
} from "helpers";
import { ChatMessageList, ChatroomList, ChatUserList } from "ui";
import { JoinPrivateRoomForm } from "ui/forms/JoinPrivateRoom.form";

export function ChatRoute() {
  const someChatrooms = useChatrooms();
  const chatroom = someChatrooms[0];
  const [messages, setMessages] = useState(chatroom.messages);

  return (
    <Row gutter={12}>
      <Col xs={0} xl={5}>
        <ChatroomList chatrooms={someChatrooms} />
        <Divider />
        <JoinPrivateRoomForm onSubmit={() => Promise.resolve()} />
      </Col>
      <Col xs={24} lg={18} xl={15}>
        <ChatMessageList
          id="chat"
          chatroom={someChatrooms[0]}
          chatrooms={someChatrooms}
          onSendMessage={(message) =>
            setMessages((prev) => prev.concat(message))
          }
        />
      </Col>
      <Col xs={0} lg={6} xl={4}>
        <ChatUserList users={chatroom.users} />
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
