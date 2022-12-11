import { CloseOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import {
  Button,
  Divider,
  Empty,
  Grid,
  Input,
  List,
  Space,
  Typography,
} from "antd";
import { ChatMessageGenerator, toUniversalVh } from "helpers";
import { useChatAutoscroll, useChatSearch } from "hooks";
import cloneDeep from "lodash.clonedeep";
import { useMemo, useRef, useState } from "react";
import key from "weak-key";
import { ChatroomDrawer, UserListDrawer } from "../drawers";
import { ChatInput } from "./ChatInput";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { groupMessages } from "./group-messages";

export function ChatMessageList({
  id,
  chatroom,
  onSendMessage,
}: {
  id: string;
  chatroom: ChatroomData;
  chatrooms: ChatroomData[];
  onSendMessage: (message: ChatMessageData) => unknown;
}) {
  const { sm } = Grid.useBreakpoint();
  const onMobile = !sm;
  const [showingChatroomDrawer, setShowingChatroomDrawer] = useState(false);
  const [showingUserListDrawer, setShowingUsersDrawer] = useState(false);
  const listBodyRef = useRef<null | HTMLDivElement>(null);
  const search = useChatSearch(chatroom);
  const renderedMessages = useMemo(() => {
    const messagesToSort = search.isSearching
      ? search.results
      : chatroom.messages;

    return cloneDeep(messagesToSort).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [search.isSearching, search.results, chatroom.messages]);
  const groupedMessages = useMemo(
    () => groupMessages(renderedMessages),
    [renderedMessages]
  );

  function toggleChatroomDrawer() {
    return setShowingChatroomDrawer((prev) => !prev);
  }

  function toggleUserListDrawer() {
    return setShowingUsersDrawer((prev) => !prev);
  }

  useChatAutoscroll(id, chatroom.messages);

  return (
    <>
      <List
        id={id}
        bordered={true}
        itemLayout="vertical"
        style={{
          transition: "height 0.2s ease-in-out",
          height: toUniversalVh(85),
          overflow: "auto",
        }}
        header={
          <>
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
                  <span>{chatroom.title}</span>
                </Typography.Title>
              </Button>
              {!search.isSearching && (
                <Typography.Text type="secondary">
                  showing {chatroom.messages.length} messages
                </Typography.Text>
              )}
              <Space>
                <Input.Group compact={true}>
                  <Input
                    type="text"
                    prefix={<SearchOutlined />}
                    placeholder={`Search #${chatroom.title}`}
                    value={search.query}
                    onChange={(event) => search.setQuery(event.target.value)}
                    style={{
                      width: search.isSearching ? "calc(100% - 35px)" : "100%",
                    }}
                  />
                  {search.isSearching && (
                    <Button
                      icon={<CloseOutlined />}
                      onClick={search.clearQuery}
                    />
                  )}
                </Input.Group>
                {onMobile && (
                  <Button
                    type="text"
                    icon={<UserOutlined style={{ color: "#f5f5f5" }} />}
                    onClick={toggleUserListDrawer}
                  />
                )}
              </Space>
            </div>
            {search.isSearching && (
              <Divider orientation="right">
                <Typography.Text type="secondary">
                  <em style={{ marginRight: "1rem" }}>
                    Searching for messages in #{chatroom.title} containing "
                    {search.query}"
                  </em>
                  {search.noResults ? (
                    <>(No results found.)</>
                  ) : (
                    <>
                      ({search.results.length}{" "}
                      {search.results.length === 1 ? "result" : "results"}{" "}
                      found.)
                    </>
                  )}
                </Typography.Text>
              </Divider>
            )}
          </>
        }
        footer={
          <ChatInput
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
        {search.isSearching && search.results.length === 0 && (
          <Empty style={{ margin: "5rem" }} />
        )}
      </List>
      {showingChatroomDrawer && (
        <ChatroomDrawer onClose={toggleChatroomDrawer} />
      )}
      {showingUserListDrawer && (
        <UserListDrawer users={chatroom.users} onClose={toggleUserListDrawer} />
      )}
    </>
  );
}
