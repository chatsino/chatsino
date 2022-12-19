import { PlusOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Input, List, Space, Tooltip, Typography } from "antd";
import { BsDoorOpen } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import { ChatroomAvatarStrip } from "./ChatroomAvatarStrip";

export const CHATROOM_DESCRIPTION_TRUNCATION_LIMIT = 40;

export function ChatroomList({ chatrooms }: { chatrooms: ChatroomData[] }) {
  const { chatroomId } = useParams();

  return (
    <List
      id="ChatroomList"
      itemLayout="vertical"
      bordered={true}
      dataSource={chatrooms}
      size="small"
      header={
        <Typography.Title
          level={4}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 0 4px 0",
          }}
        >
          <span>
            <BsDoorOpen /> <span style={{ marginLeft: "0.5rem" }}>Rooms</span>
          </span>
          <span>
            <small style={{ marginRight: "0.5rem" }}>
              {chatrooms.length} total
            </small>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {}}
            />
          </span>
        </Typography.Title>
      }
      footer={
        <Input
          type="text"
          style={{
            marginTop: "1rem",
          }}
          prefix={<SearchOutlined />}
          placeholder={`Search rooms`}
          value=""
          onChange={(event) => {}}
        />
      }
      renderItem={(item) => (
        <Link to={`/chat/${item.id}`}>
          <List.Item
            style={{ cursor: "pointer" }}
            extra={
              <Space size="small">
                <UserOutlined /> 0
              </Space>
            }
          >
            <Tooltip title={item.description}>
              <List.Item.Meta
                title={
                  <ChatroomAvatarStrip
                    chatroom={item}
                    size="small"
                    active={Boolean(
                      chatroomId && parseInt(chatroomId) === item.id
                    )}
                  />
                }
              />
            </Tooltip>
          </List.Item>
        </Link>
      )}
      style={{
        flex: 1,
        marginBottom: "1rem",
      }}
    />
  );
}
