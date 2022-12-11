import { UserOutlined } from "@ant-design/icons";
import { SlGameController } from "react-icons/sl";
import { List, Space, Typography } from "antd";
import { ReactNode } from "react";
import { Link, useMatches } from "react-router-dom";

export function ChatGameList({
  games,
}: {
  games: Array<{
    icon: ReactNode;
    title: string;
    description: string;
    route: string;
    playerCount: number;
  }>;
}) {
  const sortedGames = games.sort((a, b) => a.title.localeCompare(b.title));
  const routeMatches = useMatches();

  return (
    <List
      bordered={true}
      dataSource={sortedGames}
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
            <SlGameController />{" "}
            <span style={{ marginLeft: "0.5rem" }}>Games</span>
          </span>
          <small>{games.length} available</small>
        </Typography.Title>
      }
      renderItem={(item) => (
        <Link to={item.route}>
          <List.Item style={{ cursor: "pointer" }}>
            <List.Item.Meta
              title={
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Typography.Text
                    type={
                      routeMatches.find(
                        (match) => match.pathname === item.route
                      )
                        ? "warning"
                        : undefined
                    }
                  >
                    <span style={{ marginRight: "0.5rem" }}>{item.icon}</span>
                    <span>{item.title}</span>
                  </Typography.Text>
                  <span>
                    <UserOutlined style={{ marginRight: "0.25rem" }} />{" "}
                    {item.playerCount}
                  </span>
                </Space>
              }
              description={item.description}
            />
          </List.Item>
        </Link>
      )}
    />
  );
}
