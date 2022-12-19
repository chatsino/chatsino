import {
  CloseOutlined,
  LockOutlined,
  SearchOutlined,
  SettingOutlined,
  UnlockOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Divider,
  Input,
  Popover,
  Space,
  Typography,
} from "antd";
import { fromDateString } from "helpers";
import { UseChatSearch, useClient } from "hooks";
import { useMemo, ReactNode } from "react";
import { BsPinAngle } from "react-icons/bs";
import { GoMention } from "react-icons/go";
import { Link } from "react-router-dom";
import { ClientAvatarStrip } from "../client";
import { ChatroomAvatarStrip } from "./ChatroomAvatarStrip";
import { mentionsClient } from "./ChatMessage";

export function ChatroomHeader({
  chatroom,
  messages,
  search,
  showingMentions,
  showingPinned,
  onShowMentions,
  onShowPinned,
}: {
  chatroom: ChatroomData;
  messages: ChatMessageData[];
  search: UseChatSearch;
  showingMentions: boolean;
  showingPinned: boolean;
  onShowMentions(): unknown;
  onShowPinned(): unknown;
}) {
  const { client } = useClient();
  const mentionedMessages = useMemo(
    () => messages.filter((message) => mentionsClient(message, client)),
    [messages, client]
  );
  const pinnedMessages = useMemo(
    () => messages.filter(({ pinned }) => pinned),
    [messages]
  );

  let flavorText = chatroom.description as ReactNode;

  if (showingMentions && client) {
    flavorText = (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        <Space>
          <span>Showing {pinnedMessages.length} messages mentioning</span>
          <ClientAvatarStrip client={client} link={false} size="small" />
        </Space>
        <Button type="link" size="small" onClick={onShowMentions}>
          Clear
        </Button>
      </Typography.Text>
    );
  } else if (showingPinned) {
    flavorText = (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Showing {pinnedMessages.length} pinned messages.{" "}
        <Button type="link" size="small" onClick={onShowPinned}>
          Clear
        </Button>
      </Typography.Text>
    );
  } else if (search.isSearching) {
    flavorText = (
      <>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Searching for messages in #{chatroom.title} containing "{search.query}
          " --
          {search.noResults ? (
            <> no results found.</>
          ) : (
            <>
              {" "}
              {search.results.length}{" "}
              {search.results.length === 1 ? "result" : "results"} found.{" "}
            </>
          )}
        </Typography.Text>
        <Button type="link" size="small" onClick={search.clearQuery}>
          Clear
        </Button>
      </>
    );
  }

  return (
    <div
      id={`ChatroomHeader#${chatroom.id}`}
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
        {flavorText}
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
        <MentionButton
          chatroom={chatroom}
          active={showingMentions}
          mentions={mentionedMessages.length}
          onShowMentions={onShowMentions}
        />
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
function MentionButton({
  chatroom,
  active,
  mentions,
  onShowMentions,
}: {
  chatroom: ChatroomData;
  active: boolean;
  mentions: number;
  onShowMentions(): unknown;
}) {
  return (
    <Popover
      content={
        mentions === 0
          ? `You do not have any mentions in #${chatroom.title}.`
          : `You have ${mentions} mentions in #${chatroom.title}.`
      }
      placement="bottomRight"
    >
      <Badge color="#1668dc" count={mentions}>
        <Button
          type={active ? "default" : "text"}
          disabled={mentions === 0}
          icon={<GoMention />}
          onClick={onShowMentions}
        />
      </Badge>
    </Popover>
  );
}

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
      content={
        pinned === 0
          ? `#${chatroom.title} does not have any pinned messages.`
          : `#${chatroom.title} has ${pinned} pinned messages.`
      }
      placement="bottomRight"
    >
      <Badge count={pinned}>
        <Button
          type={active ? "default" : "text"}
          disabled={pinned === 0}
          icon={<BsPinAngle />}
          onClick={onShowPinned}
        />
      </Badge>
    </Popover>
  );
}

function LockButton({ chatroom }: { chatroom: ChatroomData }) {
  return (
    <Popover
      content={
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
      content={`Make modifications to #${chatroom.title}.`}
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
      content={`0 users are currently in #${chatroom.title}.`}
      placement="bottomRight"
    >
      <Button type="text" icon={<UserOutlined />} onClick={() => {}}>
        0
      </Button>
    </Popover>
  );
}
// #endregion
