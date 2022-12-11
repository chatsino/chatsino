import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Grid, List, Space, Typography } from "antd";
import { ChatMessageGenerator, toUniversalVh } from "helpers";
import { useChatAutoscroll } from "hooks";
import { useMemo, useRef, useState } from "react";
import key from "weak-key";
import { ChatroomDrawer, UserListDrawer } from "../drawers";
import { ChatInput } from "./ChatInput";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { groupMessages } from "./group-messages";

export function ChatMessageList({
  id,
  users,
  messages,
  onSendMessage,
}: {
  id: string;
  users: ChatUserData[];
  messages: ChatMessageData[];
  onSendMessage: (message: ChatMessageData) => unknown;
}) {
  const [raised, setRaised] = useState(false);
  const { sm } = Grid.useBreakpoint();
  const onMobile = !sm;
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);
  const [showingChatroomDrawer, setShowingChatroomDrawer] = useState(false);
  const [showingUserListDrawer, setShowingUsersDrawer] = useState(false);
  const listBodyRef = useRef<null | HTMLDivElement>(null);

  function toggleChatroomDrawer() {
    return setShowingChatroomDrawer((prev) => !prev);
  }

  function toggleUserListDrawer() {
    return setShowingUsersDrawer((prev) => !prev);
  }

  useChatAutoscroll(id, messages);

  return (
    <>
      <List
        id={id}
        bordered={true}
        itemLayout="vertical"
        style={{
          transition: "height 0.2s ease-in-out",
          height: raised
            ? toUniversalVh(onMobile ? 30 : 50)
            : toUniversalVh(85),
          overflow: "auto",
        }}
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button type="text">
              <Typography.Title level={4} style={{ margin: 0 }}>
                <Typography.Text
                  type="secondary"
                  style={{ marginRight: "0.5rem" }}
                >
                  #
                </Typography.Text>
                <span>room</span>
              </Typography.Title>
            </Button>
            <Space>
              <Button
                type="text"
                icon={<SearchOutlined style={{ color: "#f5f5f5" }} />}
              />
              {onMobile && (
                <Button
                  type="text"
                  icon={<UserOutlined style={{ color: "#f5f5f5" }} />}
                  onClick={toggleUserListDrawer}
                />
              )}
            </Space>
          </div>
        }
        footer={
          <ChatInput
            onDrawerOpen={() => setRaised(true)}
            onDrawerClose={() => setRaised(false)}
            onSend={(message) =>
              onSendMessage(
                ChatMessageGenerator.generateChatMessage({
                  author: {
                    id: 1,
                    username: "Bob Johnson",
                  },
                  content: message,
                })
              )
            }
          />
        }
      >
        <div style={{ position: "relative" }}>
          <div ref={listBodyRef}>
            {groupedMessages.map((messageGroup) => (
              <List.Item key={key(messageGroup)}>
                <ChatMessageGroup messageGroup={messageGroup} />
              </List.Item>
            ))}
          </div>
        </div>
      </List>
      {showingChatroomDrawer && (
        <ChatroomDrawer onClose={toggleChatroomDrawer} />
      )}
      {showingUserListDrawer && (
        <UserListDrawer users={users} onClose={toggleUserListDrawer} />
      )}
    </>
  );
}
