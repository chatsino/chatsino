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
import { ReactNode, useMemo } from "react";
import { BsPinAngle } from "react-icons/bs";
import { GoMention } from "react-icons/go";
import { Link } from "react-router-dom";
import { ClientAvatarStrip } from "../client";
import { mentionsClient } from "./ChatMessage";
import { RoomAvatarStrip } from "./RoomAvatarStrip";

export function RoomHeader({
  room,
  search,
  showingMentions,
  showingPinned,
  onShowMentions,
  onShowPinned,
}: {
  room: ChatsinoRoom;
  search: UseChatSearch;
  showingMentions: boolean;
  showingPinned: boolean;
  onShowMentions(): unknown;
  onShowPinned(): unknown;
}) {
  const messages = room.messages as ChatsinoMessage[];
  const { client } = useClient();
  const mentionedMessages = useMemo(
    () => messages,
    // messages.filter((message) =>
    //   mentionsClient(message, client as ChatsinoUser)
    // ),
    [messages, client]
  );
  const pinnedMessages = useMemo(
    () => messages.filter(() => false),
    // () => messages.filter(({ pinned }) => pinned),
    [messages]
  );

  let flavorText = room.description as ReactNode;

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
          Searching for messages in #{room.title} containing "{search.query}" --
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
      id={`RoomHeader#${room.id}`}
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
                {room.owner && (
                  <ClientAvatarStrip client={room.owner} size="small" />
                )}
              </Space>
              <Typography.Text type="secondary" style={{ display: "block" }}>
                <small>on {fromDateString(room.createdAt)}</small>
              </Typography.Text>
              <Typography.Text type="secondary" style={{ display: "block" }}>
                <small>(updated at {fromDateString(room.changedAt)})</small>
              </Typography.Text>
            </Space>
          }
          placement="bottomLeft"
        >
          <div style={{ cursor: "pointer" }}>
            <RoomAvatarStrip room={room} size="large" link={false} />
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
            placeholder={`Search #${room.title}`}
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
          room={room}
          active={showingMentions}
          mentions={mentionedMessages.length}
          onShowMentions={onShowMentions}
        />
        <PinButton
          room={room}
          active={showingPinned}
          pinned={pinnedMessages.length}
          onShowPinned={onShowPinned}
        />
        <LockButton room={room} />
        <UserButton room={room} />
        <SettingsButton room={room} />
      </Space>
    </div>
  );
}

// #region Buttons
function MentionButton({
  room,
  active,
  mentions,
  onShowMentions,
}: {
  room: ChatsinoRoom;
  active: boolean;
  mentions: number;
  onShowMentions(): unknown;
}) {
  return (
    <Popover
      content={
        mentions === 0
          ? `You do not have any mentions in #${room.title}.`
          : `You have ${mentions} mentions in #${room.title}.`
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
  room,
  active,
  pinned,
  onShowPinned,
}: {
  room: ChatsinoRoom;
  active: boolean;
  pinned: number;
  onShowPinned(): unknown;
}) {
  return (
    <Popover
      content={
        pinned === 0
          ? `#${room.title} does not have any pinned messages.`
          : `#${room.title} has ${pinned} pinned messages.`
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

function LockButton({ room }: { room: ChatsinoRoom }) {
  return (
    <Popover
      content={
        true
          ? // room.public
            `#${room.title} is public.`
          : `#${room.title} is not public.`
      }
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={true ? <UnlockOutlined /> : <LockOutlined />}
        // icon={room.public ? <UnlockOutlined /> : <LockOutlined />}
      />
    </Popover>
  );
}

function SettingsButton({ room }: { room: ChatsinoRoom }) {
  return (
    <Popover
      content={`Make modifications to #${room.title}.`}
      placement="bottomRight"
    >
      <Link to={`/chat/${room.id}/settings`}>
        <Button type="text" icon={<SettingOutlined />} />
      </Link>
    </Popover>
  );
}

function UserButton({ room }: { room: ChatsinoRoom }) {
  return (
    <Popover
      content={`0 users are currently in #${room.title}.`}
      placement="bottomRight"
    >
      <Button type="text" icon={<UserOutlined />} onClick={() => {}}>
        0
      </Button>
    </Popover>
  );
}
// #endregion
