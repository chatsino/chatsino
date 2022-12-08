import { useClient } from "./useClient";

export function useNavigation() {
  const { client } = useClient();

  if (client) {
    return [
      {
        to: "/",
        title: "Home",
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
