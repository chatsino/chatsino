import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import * as config from "config";
import { useAuthentication } from "./useAuthentication";
import { useClient } from "./useClient";
import { Chance } from "chance";

type Response = {
  data?: unknown;
  error?: string;
  message: string;
};

type SubscriberData = Record<string, (response: Response) => unknown>; // Message Kind -> Message Handler

type SubscriberLookup = Record<string, SubscriberData>; // Subscriber Name -> Subscriber Data

export interface SocketContextType {
  socket: null | WebSocket;
  initialized: boolean;
  initialize: () => void;
  makeRequest: (kind: string, args?: Record<string, unknown>) => void;
  oneTimeRequest: (
    kind: string,
    args?: Record<string, unknown>
  ) => Promise<Response>;
  subscribe: (
    name: string,
    kind: string,
    onResponse: (response: Response) => unknown
  ) => unknown;
  unsubscribe: (name: string, kind?: string) => unknown;
}

const CHANCE = new Chance();

const SocketContext = createContext<SocketContextType>({
  socket: null,
  initialized: false,
  initialize() {},
  makeRequest() {},
  oneTimeRequest: Promise.resolve,
  subscribe() {},
  unsubscribe() {},
});

export function SocketProvider({ children }: PropsWithChildren) {
  const { requestTicket } = useAuthentication();
  const { client } = useClient();
  const socket = useRef<null | WebSocket>(null);
  const [initialized, setInitialized] = useState(false);
  const attemptingToReconnect = useRef<null | NodeJS.Timeout>(null);
  const subscriberLookup = useRef<SubscriberLookup>({});

  const initialize = useCallback(async () => {
    try {
      if (attemptingToReconnect.current) {
        clearTimeout(attemptingToReconnect.current);
      }

      if (socket.current) {
        socket.current.close();
        socket.current = null;
      }

      const ticket = await requestTicket();
      const url = new URL(config.SOCKET_SERVER_ADDRESS);

      url.search = new URLSearchParams({
        ticket,
      }).toString();

      socket.current = new WebSocket(url);

      socket.current.onopen = function handleSocketOpen(event) {
        console.info("Opened connection.", event);

        if (attemptingToReconnect.current) {
          clearTimeout(attemptingToReconnect.current);
        }

        setInitialized(true);
      };

      socket.current.onclose = function handleSocketClose(event) {
        console.info("Closed connection.", event);

        attemptingToReconnect.current = setTimeout(
          initialize,
          config.SOCKET_RECONNECT_ATTEMPT_RATE
        );
      };

      socket.current.onerror = function handleSocketError(event) {
        console.error("Encountered error.", event);
      };

      socket.current.onmessage = function handleSocketMessage(event) {
        console.info("Received message.", event);

        const { kind, data, error, message = "" } = JSON.parse(event.data);

        for (const subscriberData of Object.values(subscriberLookup.current)) {
          subscriberData[kind]?.({ data, error, message });
        }
      };
    } catch (error) {
      console.error("Unable to connect -- retrying soon.", error);
    }
  }, [requestTicket]);

  const makeRequest = useCallback(
    (kind: string, args: Record<string, unknown> = {}) => {
      if (client) {
        const request = {
          kind,
          args,
        };

        socket.current?.send(JSON.stringify(request));
      }
    },
    [client]
  );

  const subscribe = useCallback(
    (
      name: string,
      kind: string,
      onResponse: (response: Response) => unknown
    ) => {
      if (!subscriberLookup.current[name]) {
        subscriberLookup.current[name] = {};
      }

      subscriberLookup.current[name][kind] = onResponse;
    },
    []
  );

  const unsubscribe = useCallback((name: string, kind?: string) => {
    if (kind) {
      if (subscriberLookup.current[name]) {
        delete subscriberLookup.current[name][kind];
      }
    } else {
      delete subscriberLookup.current[name];
    }
  }, []);

  const oneTimeRequest = useCallback(
    async (kind: string, args: Record<string, unknown> = {}) => {
      const subscriberName = CHANCE.name();
      const response = (await new Promise((resolve) => {
        makeRequest(kind, args);
        subscribe(subscriberName, kind, resolve);
      })) as unknown as Response;

      unsubscribe(subscriberName, kind);

      return response;
    },
    [makeRequest, subscribe, unsubscribe]
  );

  const value = useMemo(
    () => ({
      socket: socket.current,
      initialized,
      initialize,
      makeRequest,
      oneTimeRequest,
      subscribe,
      unsubscribe,
    }),
    [
      initialized,
      initialize,
      makeRequest,
      oneTimeRequest,
      subscribe,
      unsubscribe,
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
