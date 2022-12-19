import {
  CloseOutlined,
  LockOutlined,
  SearchOutlined,
  SettingOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Divider, Input, Popover, Space, Typography } from "antd";
import { fromDateString } from "helpers";
import { UseChatSearch } from "hooks";
import { useMemo } from "react";
import { BsPinAngle } from "react-icons/bs";
import { Link } from "react-router-dom";
import { ClientAvatarStrip } from "ui/client";
import { ChatroomAvatarStrip } from "./ChatroomAvatarStrip";

export function ChatroomHeader({
  chatroom,
  messages,
  search,
  showingPinned,
  onShowPinned,
}: {
  chatroom: ChatroomData;
  messages: ChatMessageData[];
  search: UseChatSearch;
  showingPinned: boolean;
  onShowPinned(): unknown;
}) {
  const pinnedMessages = useMemo(
    () => messages.filter(({ pinned }) => pinned),
    [messages]
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Space>
        <Popover
          title={
            <Space direction="vertical">
              <Space>
                <Typography.Text type="secondary" style={{ display: "block" }}>
                  Created by
                </Typography.Text>
                <ClientAvatarStrip client={chatroom.createdBy} size="small" />
              </Space>
              <Typography.Text type="secondary" style={{ display: "block" }}>
                <small>on {fromDateString(chatroom.createdAt)}</small>
              </Typography.Text>
              <Typography.Text type="secondary" style={{ display: "block" }}>
                <small>(updated at {fromDateString(chatroom.updatedAt)})</small>
              </Typography.Text>
            </Space>
          }
          placement="bottomLeft"
        >
          <div style={{ cursor: "pointer" }}>
            <ChatroomAvatarStrip
              chatroom={chatroom}
              size="large"
              link={false}
            />
          </div>
        </Popover>
        <Divider type="vertical" />
        {showingPinned ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Showing {pinnedMessages.length} pinned messages.{" "}
            <Button type="link" size="small" onClick={onShowPinned}>
              Clear
            </Button>
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {search.isSearching ? (
              <>
                Searching for messages in #{chatroom.title} containing "
                {search.query}" --
                {search.noResults ? (
                  <> no results found.</>
                ) : (
                  <>
                    {" "}
                    {search.results.length}{" "}
                    {search.results.length === 1 ? "result" : "results"} found.{" "}
                  </>
                )}
                <Button type="link" size="small" onClick={search.clearQuery}>
                  Clear
                </Button>
              </>
            ) : (
              chatroom.description
            )}
          </Typography.Text>
        )}
      </Space>
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
            <Button icon={<CloseOutlined />} onClick={search.clearQuery} />
          )}
        </Input.Group>
        <PinButton
          chatroom={chatroom}
          active={showingPinned}
          pinned={pinnedMessages.length}
          onShowPinned={onShowPinned}
        />
        <LockButton chatroom={chatroom} />
        <UserButton chatroom={chatroom} />
        <SettingsButton chatroom={chatroom} />
      </Space>
    </div>
  );
}

// #region Buttons
function PinButton({
  chatroom,
  active,
  pinned,
  onShowPinned,
}: {
  chatroom: ChatroomData;
  active: boolean;
  pinned: number;
  onShowPinned(): unknown;
}) {
  return (
    <Popover
      title={
        pinned === 0
          ? `#${chatroom.title} does not have any pinned messages.`
          : `#${chatroom.title} has ${pinned} pinned messages.`
      }
      placement="bottomRight"
    >
      <Button
        type="text"
        disabled={pinned === 0}
        icon={
          <Typography.Text type={active ? "warning" : undefined}>
            <BsPinAngle />
          </Typography.Text>
        }
        onClick={onShowPinned}
      />
    </Popover>
  );
}

function LockButton({ chatroom }: { chatroom: ChatroomData }) {
  return (
    <Popover
      title={
        chatroom.public
          ? `#${chatroom.title} is public.`
          : `#${chatroom.title} is not public.`
      }
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={chatroom.public ? <UnlockOutlined /> : <LockOutlined />}
      />
    </Popover>
  );
}

function SettingsButton({ chatroom }: { chatroom: ChatroomData }) {
  return (
    <Popover
      title={`Make modifications to #${chatroom.title}.`}
      placement="bottomRight"
    >
      <Link to={`/chat/${chatroom.id}/settings`}>
        <Button type="text" icon={<SettingOutlined />} />
      </Link>
    </Popover>
  );
}

function UserButton({ chatroom }: { chatroom: ChatroomData }) {
  return (
    <Popover
      title={`0 users are currently in #${chatroom.title}.`}
      placement="bottomRight"
    >
      <Button type="text" icon={<UserOutlined />} onClick={() => {}}>
        0
      </Button>
    </Popover>
  );
}
// #endregion
