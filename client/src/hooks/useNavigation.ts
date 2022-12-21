import { SafeClient } from "schemas";
import { useClient } from "./client";

export function useNavigation() {
  const { client } = useClient() as { client: SafeClient };

  if (client) {
    return [
      {
        to: "/me",
        title: `@${client.username}`,
      },
      {
        to: "/chat",
        title: "Chat",
      },
      {
        to: "/games",
        title: "Games",
      },
      {
        to: "/help",
        title: "Help",
      },
      {
        to: "/shop",
        title: "Shop",
      },
    ];
  } else {
    return [
      {
        to: "/help",
        title: "Help",
      },
      {
        to: "/signin",
        title: "Sign in",
      },
      {
        to: "/signout",
        title: "Sign out",
      },
    ];
  }
}
