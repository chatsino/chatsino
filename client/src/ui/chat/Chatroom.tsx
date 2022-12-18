import {
  CloseOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Empty, Grid, Input, List, Space, Typography } from "antd";
import { toUniversalVh } from "helpers";
import { useChatAutoscroll, useChatSearch } from "hooks";
import cloneDeep from "lodash.clonedeep";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import key from "weak-key";
import { ChatroomDrawer, UserListDrawer } from "../drawers";
import { ChatInput } from "./ChatInput";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { ChatroomAvatarStrip } from "./ChatroomAvatarStrip";
import { groupMessages } from "./group-messages";

export function Chatroom({
  id,
  chatroom,
  messages,
  onSendMessage,
  onPinMessage,
  onDeleteMessage,
}: {
  id: string;
  chatroom: ChatroomData;
  messages: ChatMessageData[];
  onSendMessage: (message: string) => unknown;
  onPinMessage: (messageId: number) => unknown;
  onDeleteMessage: (messageId: number) => unknown;
}) {
  const { sm } = Grid.useBreakpoint();
  const onMobile = !sm;
  const [showingChatroomDrawer, setShowingChatroomDrawer] = useState(false);
  const [showingUserListDrawer, setShowingUsersDrawer] = useState(false);
  const listBodyRef = useRef<null | HTMLDivElement>(null);
  const search = useChatSearch(messages);
  const renderedMessages = useMemo(() => {
    const messagesToSort = search.isSearching ? search.results : messages;

    return cloneDeep(messagesToSort).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [search.isSearching, search.results, messages]);
  const groupedMessages = useMemo(
    () => groupMessages(renderedMessages),
    [renderedMessages]
  );
  const uniqueAuthorCount = Array.from(
    new Set(groupedMessages.map((group) => group.author))
  ).length;
  const [draftUpdate, setDraftUpdate] = useState("");
  const clearDraftUpdate = useCallback(() => setDraftUpdate(""), []);

  function toggleChatroomDrawer() {
    return setShowingChatroomDrawer((prev) => !prev);
  }

  function toggleUserListDrawer() {
    return setShowingUsersDrawer((prev) => !prev);
  }

  function mentionUser(username: string) {
    setDraftUpdate(`@${username}`);
  }

  useChatAutoscroll(id, messages);

  return (
    <>
      <List
        id={id}
        bordered={true}
        itemLayout="vertical"
        style={{
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
              <ChatroomAvatarStrip chatroom={chatroom} size="large" />
              {!search.isSearching && (
                <Typography.Text
                  type="secondary"
                  style={{ textTransform: "uppercase", letterSpacing: 2 }}
                >
                  <small>
                    Showing {messages.length} messages from {uniqueAuthorCount}{" "}
                    users
                  </small>
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
                    icon={<UserOutlined />}
                    onClick={toggleUserListDrawer}
                  />
                )}
                <Link to={`/chat/${chatroom.id}/settings`}>
                  <Button type="text" icon={<SettingOutlined />} />
                </Link>
              </Space>
            </div>
            {search.isSearching && (
              <Typography.Text
                type="secondary"
                style={{
                  display: "block",
                  textAlign: "right",
                  marginTop: "0.5rem",
                }}
              >
                <em style={{ marginRight: "1rem" }}>
                  Searching for messages in #{chatroom.title} containing "
                  {search.query}"
                </em>
                {search.noResults ? (
                  <>(No results found.)</>
                ) : (
                  <>
                    ({search.results.length}{" "}
                    {search.results.length === 1 ? "result" : "results"} found.)
                  </>
                )}
              </Typography.Text>
            )}
          </>
        }
        footer={
          <ChatInput
            onSend={onSendMessage}
            draftUpdate={draftUpdate}
            clearDraftUpdate={clearDraftUpdate}
          />
        }
      >
        <div style={{ position: "relative" }}>
          <div ref={listBodyRef}>
            {groupedMessages.map((messageGroup) => (
              <List.Item key={key(messageGroup)}>
                <ChatMessageGroup
                  messageGroup={messageGroup}
                  onMentionUser={mentionUser}
                  onPinMessage={onPinMessage}
                  onDeleteMessage={onDeleteMessage}
                />
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
        <UserListDrawer users={[]} onClose={toggleUserListDrawer} />
      )}
    </>
  );
}
