import { ReactNode } from "react";

export const navigation: Array<{ to: string; children: ReactNode }> = [
  {
    to: "/",
    children: "Home",
  },
  {
    to: "/chat",
    children: "Chat",
  },
  {
    to: "/games",
    children: "Games",
  },
  {
    to: "/help",
    children: "Help",
  },
  {
    to: "/shop",
    children: "Shop",
  },
];
