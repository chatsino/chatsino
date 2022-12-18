import { LockFilled } from "@ant-design/icons";
import { Col, Collapse, Row } from "antd";
import { toUniversalVh } from "helpers";
import {
  ChatroomProvider,
  ClientProvider,
  SocketProvider,
  useAuthentication,
  useChatrooms,
  useClient,
  useSocket,
  useUniversalVhUnit,
  useUpdatingChatroomList,
} from "hooks";
import { useEffect, useRef } from "react";
import { BiCoinStack } from "react-icons/bi";
import { FaHorse } from "react-icons/fa";
import {
  GiCardAceSpades,
  GiCarWheel,
  GiCat,
  GiVendingMachine,
} from "react-icons/gi";
import { Outlet, useLoaderData } from "react-router-dom";
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
        <ChatroomProvider>
          <SiteLayout>
            <Inner />
          </SiteLayout>
        </ChatroomProvider>
      </SocketProvider>
    </ClientProvider>
  );
}

function Inner() {
  const { chatrooms } = useUpdatingChatroomList();
  const { validate } = useAuthentication();
  const { client, setClient } = useClient();
  const { initialize } = useSocket();
  const {
    data: { users },
  } = useChatrooms();
  const data = useLoaderData() as { client: SafeClient };
  const initiallyValidated = useRef(false);
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
            initialize();
          }
        } catch (error) {}
      };

      handleValidate();
    }
  }, [validate, setClient, initialize]);

  return (
    <Row gutter={20}>
      <Col xs={0} lg={4}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ChatUserList users={users} />
          </div>
          <div style={{ flex: 1 }}>
            <Collapse accordion={true} ghost={true}>
              <Collapse.Panel
                key="JoinPrivateRoomForm"
                header="Join private room"
                extra={<LockFilled />}
                showArrow={false}
              >
                <JoinPrivateRoomForm onSubmit={() => Promise.resolve()} />
              </Collapse.Panel>
              <Collapse.Panel
                key="PurchaseChipsForm"
                header="Purchase chips"
                extra={<BiCoinStack />}
                showArrow={false}
              >
                <PurchaseChipsForm onSubmit={() => Promise.resolve()} />
              </Collapse.Panel>
            </Collapse>
          </div>
        </div>
      </Col>
      <Col
        xs={24}
        lg={17}
        style={{
          height: toUniversalVh(85),
          overflow: "auto",
        }}
      >
        <Outlet />
      </Col>
      <Col xs={0} lg={3}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ChatroomList chatrooms={chatrooms} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ChatGameList games={games} />
          </div>
        </div>
      </Col>
    </Row>
  );
}
