import { toUniversalVh } from "helpers";
import {
  RoomProvider,
  ClientProvider,
  SocketProvider,
  useAuthenticationRequests,
  useClient,
  useSocket,
  useTokenExpiration,
  useUniversalVhUnit,
  useUpdatingRoomList,
  useUpdatingUserList,
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
  Col,
  Collapse,
  JoinPrivateRoomForm,
  LockFilled,
  PurchaseChipsForm,
  Row,
  SiteLayout,
} from "ui";

export function RootRoute() {
  return (
    <ClientProvider>
      <SocketProvider>
        <RoomProvider>
          <SiteLayout>
            <Inner />
          </SiteLayout>
        </RoomProvider>
      </SocketProvider>
    </ClientProvider>
  );
}

function Inner() {
  const users = useUpdatingUserList();
  const { chatrooms } = useUpdatingRoomList();
  const { validate } = useAuthenticationRequests();
  const { client, setClient } = useClient();
  const { initialize, shutdown } = useSocket();
  const data = useLoaderData() as { client: SafeClient };
  const initiallyValidated = useRef(false);
  const initializedSocket = useRef(false);
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
  useTokenExpiration();

  useEffect(() => {
    if (data?.client && !client) {
      setClient(data.client);
    }
  }, [data, client, setClient]);

  useEffect(() => {
    if (!initiallyValidated.current) {
      initiallyValidated.current = true;
      validate();
    }
  }, [validate]);

  useEffect(() => {
    if (!initializedSocket.current && client) {
      initializedSocket.current = true;
      initialize();
    } else if (!client && initializedSocket.current) {
      initializedSocket.current = false;
      shutdown();
    }
  }, [client, initialize, shutdown]);

  return (
    <Row gutter={20}>
      <Col xs={0} lg={4}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ChatUserList active={users.active} inactive={users.inactive} />
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
          <ChatGameList games={games} />
        </div>
      </Col>
    </Row>
  );
}
