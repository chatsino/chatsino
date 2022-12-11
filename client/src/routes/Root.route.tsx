import {
  BarChartOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Col, Divider, Row, Space } from "antd";
import { ChatroomGenerator } from "helpers";
import {
  ClientProvider,
  SocketProvider,
  useAuthentication,
  useClient,
  useUniversalVhUnit,
} from "hooks";
import { useEffect, useRef } from "react";
import { FaHorse } from "react-icons/fa";
import {
  GiCardAceSpades,
  GiCarWheel,
  GiCat,
  GiVendingMachine,
} from "react-icons/gi";
import { Link, Outlet, useLoaderData, useMatches } from "react-router-dom";
import { SafeClient } from "schemas";
import {
  ChatGameList,
  ChatroomList,
  ChatUserList,
  JoinPrivateRoomForm,
  PurchaseChipsForm,
  SiteLayout,
} from "ui";

export function RootRoute() {
  return (
    <ClientProvider>
      <SocketProvider>
        <SiteLayout>
          <Inner />
        </SiteLayout>
      </SocketProvider>
    </ClientProvider>
  );
}

function Inner() {
  const { validate } = useAuthentication();
  const { client, setClient } = useClient();
  const data = useLoaderData() as { client: SafeClient };
  const initiallyValidated = useRef(false);
  const someChatrooms = useChatrooms();
  const chatroom = someChatrooms[0];
  const routeMatches = useMatches();
  const games = [
    {
      title: "Blackjack",
      description: "Score higher than the dealer without going bust.",
      route: "/games/blackjack",
      icon: <GiCardAceSpades />,
      playerCount: 3,
    },
    {
      title: "Crossing",
      description:
        "Compete for limited resources in a world of unlimited desires.",
      route: "/games/crossing",
      icon: <GiCat />,
      playerCount: 1,
    },
    {
      title: "Racing",
      description: "Bet on how the racers will place.",
      route: "/games/racing",
      icon: <FaHorse />,
      playerCount: 12,
    },
    {
      title: "Roulette",
      description: "Round and round the wheel of destiny turns.",
      route: "/games/roulette",
      icon: <GiCarWheel />,
      playerCount: 8,
    },
    {
      title: "Slots",
      description: "Get lucky and earn yourself a jackpot.",
      route: "/games/slots",
      icon: <GiVendingMachine />,
      playerCount: 8,
    },
  ];
  const buttonLinks = [
    {
      title: "Help",
      icon: <QuestionCircleOutlined />,
      route: "/help",
    },
    {
      title: "Stats",
      icon: <BarChartOutlined />,
      route: "/stats",
    },
    {
      title: "Admin",
      icon: <SettingOutlined />,
      route: "/admin",
    },
  ];

  useUniversalVhUnit();

  useEffect(() => {
    if (data?.client && !client) {
      setClient(data.client);
    }
  }, [data, client, setClient]);

  useEffect(() => {
    if (!initiallyValidated.current) {
      initiallyValidated.current = true;

      const handleValidate = async () => {
        try {
          const client = await validate();

          if (client) {
            setClient(client);
          }
        } catch (error) {}
      };

      handleValidate();
    }
  }, [validate, setClient]);

  return (
    <Row gutter={20}>
      <Col xs={0} lg={4}>
        <ChatUserList users={chatroom.users} />
        <Divider />
        <ChatGameList games={games} />
        <Divider />
        <Space direction="vertical" style={{ width: "100%" }}>
          {buttonLinks.map((buttonLink) => (
            <Link key={buttonLink.route} to={buttonLink.route}>
              <Button
                size="large"
                disabled={Boolean(
                  routeMatches.find(
                    (match) => match.pathname === buttonLink.route
                  )
                )}
                block={true}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {buttonLink.title}
                {buttonLink.icon}
              </Button>
            </Link>
          ))}
        </Space>
      </Col>
      <Col xs={24} lg={16}>
        <Outlet />
      </Col>
      <Col xs={0} lg={4}>
        <ChatroomList chatrooms={someChatrooms} />
        <Divider />
        <JoinPrivateRoomForm onSubmit={() => Promise.resolve()} />
        <Divider />
        <PurchaseChipsForm onSubmit={() => Promise.resolve()} />
      </Col>
    </Row>
  );
}

function useChatrooms() {
  return ChatroomGenerator.generateChatroomList(30);
}
