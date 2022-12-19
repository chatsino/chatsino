import { Empty, Grid, List } from "antd";
import { toUniversalVh } from "helpers";
import { useChatAutoscroll, useChatSearch } from "hooks";
import cloneDeep from "lodash.clonedeep";
import { useCallback, useMemo, useRef, useState } from "react";
import key from "weak-key";
import { ChatroomDrawer, UserListDrawer } from "../drawers";
import { ChatInput } from "./ChatInput";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { ChatroomHeader } from "./ChatroomHeader";
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
  const [showingPinned, setShowingPinned] = useState(false);
  const showPinnedMessages = useCallback(
    () => setShowingPinned((prev) => !prev),
    []
  );
  const [draftUpdate, setDraftUpdate] = useState("");
  const clearDraftUpdate = useCallback(() => setDraftUpdate(""), []);
  const listBodyRef = useRef<null | HTMLDivElement>(null);
  const search = useChatSearch(messages);
  const renderedMessages = useMemo(() => {
    let messagesToSort = search.isSearching ? search.results : messages;

    if (showingPinned) {
      messagesToSort = messagesToSort.filter(({ pinned }) => pinned);
    }

    return cloneDeep(messagesToSort).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [search.isSearching, search.results, messages, showingPinned]);
  const groupedMessages = useMemo(
    () => groupMessages(renderedMessages),
    [renderedMessages]
  );

  function toggleChatroomDrawer() {
    return setShowingChatroomDrawer((prev) => !prev);
  }

  function toggleUserListDrawer() {
    if (onMobile) {
      return setShowingUsersDrawer((prev) => !prev);
    }
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
          <ChatroomHeader
            chatroom={chatroom}
            messages={messages}
            search={search}
            showingPinned={showingPinned}
            onShowPinned={showPinnedMessages}
          />
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
