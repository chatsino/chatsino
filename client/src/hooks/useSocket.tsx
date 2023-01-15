import { Chance } from "chance";
import * as config from "config";
import { CombinedSocketRequests } from "enums";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthenticationRequests, useClient } from "./client";

export type SocketResponse = {
  kind: CombinedSocketRequests;
  data: {
    error?: boolean;
    _message?: string;
    [value: string]: unknown;
  };
};

export type SocketResponseData = SocketResponse["data"];

export type SocketSubscriberData = Record<
  CombinedSocketRequests,
  (response: SocketResponseData) => unknown
>;

export type SocketSubscriberLookup = Record<string, SocketSubscriberData>;

export interface SocketContextType {
  socket: null | WebSocket;
  initialized: boolean;
  initialize: () => void;
  shutdown: () => void;
  makeRequest: (kind: string, args?: Record<string, unknown>) => void;
  oneTimeRequest: (
    kind: string,
    args?: Record<string, unknown>
  ) => Promise<SocketResponseData>;
  subscribe: (
    name: string,
    kind: string,
    onResponse: (response: SocketResponseData) => unknown
  ) => unknown;
  unsubscribe: (name: string, kind?: string) => unknown;
}

const CHANCE = new Chance();

const SocketContext = createContext<SocketContextType>({
  socket: null,
  initialized: false,
  initialize() {},
  shutdown() {},
  makeRequest() {},
  oneTimeRequest: Promise.resolve,
  subscribe() {},
  unsubscribe() {},
});

export function SocketProvider({ children }: PropsWithChildren) {
  const { requestTicket } = useAuthenticationRequests();
  const { client } = useClient();
  const socket = useRef<null | WebSocket>(null);
  const [initialized, setInitialized] = useState(false);
  const shouldAttemptReconnect = useRef(false);
  const attemptingToReconnect = useRef<null | NodeJS.Timeout>(null);
  const subscriberLookup = useRef<SocketSubscriberLookup>({});
  const initialize = useCallback(async () => {
    try {
      shouldAttemptReconnect.current = true;

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

        if (shouldAttemptReconnect.current) {
          attemptingToReconnect.current = setTimeout(
            initialize,
            config.SOCKET_RECONNECT_ATTEMPT_RATE
          );
        }
      };

      socket.current.onerror = function handleSocketError(event) {
        console.error("Encountered error.", event);
      };

      socket.current.onmessage = function handleSocketMessage(event) {
        console.info("Received message.", event);

        const response = JSON.parse(event.data) as SocketResponse;

        for (const subscriberData of Object.values(subscriberLookup.current)) {
          subscriberData[response.kind]?.(response);
        }
      };
    } catch (error) {
      console.error("Unable to connect -- retrying soon.", error);
    }
  }, [requestTicket]);
  const shutdown = useCallback(() => {
    console.log("Shutting down socket connection.");

    shouldAttemptReconnect.current = false;

    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
  }, []);
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
      kind: CombinedSocketRequests,
      onResponse: (response: SocketResponseData) => unknown
    ) => {
      if (!subscriberLookup.current[name]) {
        subscriberLookup.current[name] = {} as SocketSubscriberData;
      }

      subscriberLookup.current[name][kind] = (response: SocketResponse) =>
        onResponse(response.data);
    },
    []
  );
  const unsubscribe = useCallback(
    (name: string, kind?: CombinedSocketRequests) => {
      if (kind) {
        if (subscriberLookup.current[name]) {
          delete subscriberLookup.current[name][kind];

          if (Object.keys(subscriberLookup.current[name]).length === 0) {
            delete subscriberLookup.current[name];
          }
        }
      } else {
        delete subscriberLookup.current[name];
      }
    },
    []
  );
  const oneTimeRequest = useCallback(
    async (
      kind: CombinedSocketRequests,
      args: Record<string, unknown> = {}
    ) => {
      const subscriberName = CHANCE.guid();
      const response = (await new Promise((resolve) => {
        makeRequest(kind, args);
        subscribe(subscriberName, kind, resolve);
      })) as unknown as SocketResponse;

      unsubscribe(subscriberName, kind);

      return response.data;
    },
    [makeRequest, subscribe, unsubscribe]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const windowWithSubscriberLookup = window as unknown as Window & {
        SUBSCRIBER_LOOKUP: SocketSubscriberLookup;
      };
      windowWithSubscriberLookup.SUBSCRIBER_LOOKUP = subscriberLookup.current;
    }
  }, []);

  const value = useMemo(
    () => ({
      socket: socket.current,
      initialized,
      initialize,
      shutdown,
      makeRequest,
      oneTimeRequest,
      subscribe,
      unsubscribe,
    }),
    [
      initialized,
      initialize,
      shutdown,
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
