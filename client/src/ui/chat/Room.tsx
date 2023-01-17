import { Empty, Grid, List } from "antd";
import { toUniversalVh } from "helpers";
import { useClient, useRoomAutoscroll, useRoomSearch } from "hooks";
import cloneDeep from "lodash.clonedeep";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import key from "weak-key";
import { ChatroomDrawer, UserListDrawer } from "../drawers";
import { ChatInput } from "./ChatInput";
import { mentionsClient } from "./ChatMessage";
import { ChatMessageGroup } from "./ChatMessageGroup";
import { groupMessages } from "./group-messages";
import { RoomHeader } from "./RoomHeader";

export function Room({
  id,
  room,
  onSendMessage,
  onPinMessage,
  onDeleteMessage,
}: {
  id: string;
  room: ChatsinoRoom;
  onSendMessage: (message: string) => unknown;
  onPinMessage: (messageId: string) => unknown;
  onDeleteMessage: (messageId: string) => unknown;
}) {
  const { client } = useClient();
  const { sm } = Grid.useBreakpoint();
  const onMobile = !sm;
  const [showingChatroomDrawer, setShowingChatroomDrawer] = useState(false);
  const [showingUserListDrawer, setShowingUsersDrawer] = useState(false);
  const [showingMentions, setShowingMentions] = useState(false);
  const showMentions = useCallback(
    () => setShowingMentions((prev) => !prev),
    []
  );
  const [showingPinned, setShowingPinned] = useState(false);
  const showPinnedMessages = useCallback(
    () => setShowingPinned((prev) => !prev),
    []
  );
  const [draftUpdate, setDraftUpdate] = useState("");
  const clearDraftUpdate = useCallback(() => setDraftUpdate(""), []);
  const listBodyRef = useRef<null | HTMLDivElement>(null);
  const roomMessages = room.messages as ChatsinoMessage[];
  const search = useRoomSearch(roomMessages);
  const renderedMessages = useMemo(() => {
    let messagesToSort = search.isSearching ? search.results : roomMessages;

    if (showingMentions) {
      // messagesToSort = messagesToSort.filter((message) =>
      //   mentionsClient(message, client as ChatsinoUser)
      // );
    } else if (showingPinned) {
      messagesToSort = messagesToSort.filter(() => false);
      // messagesToSort = messagesToSort.filter(({ pinned }) => pinned);
    }

    return cloneDeep(messagesToSort).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [
    search.isSearching,
    search.results,
    showingPinned,
    showingMentions,
    roomMessages,
    client,
  ]);
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

  useRoomAutoscroll(room.id, roomMessages);

  useEffect(() => {
    if (showingMentions) {
      setShowingPinned(false);

      if (renderedMessages.length === 0) {
        setShowingMentions(false);
      }
    }
  }, [showingMentions, renderedMessages.length]);

  useEffect(() => {
    if (showingPinned) {
      setShowingMentions(false);

      if (renderedMessages.length === 0) {
        setShowingPinned(false);
      }
    }
  }, [showingPinned, renderedMessages.length]);

  return (
    <>
      <List
        id={`__${id}`}
        bordered={true}
        itemLayout="vertical"
        style={{
          height: toUniversalVh(85),
          overflow: "auto",
        }}
        header={
          <RoomHeader
            room={room}
            search={search}
            showingMentions={showingMentions}
            showingPinned={showingPinned}
            onShowMentions={showMentions}
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
