import {
  chatRedirectLoader,
  requireAdminLoader,
  requireClientLoader,
  roomListLoader,
  roomLoader,
  roomSettingsLoader,
  userListLoader,
} from "loaders";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { AdminRoute } from "./Admin.route";
import { RoomBlacklistRoute } from "./RoomBlacklist.route";
import { RoomSettingsRoute } from "./RoomSettings.route";
import { RoomWhitelistRoute } from "./ChatroomWhitelist.route";
import { ErrorRoute } from "./Error.route";
import {
  BlackjackRoute,
  CrossingRoute,
  RacingRoute,
  RouletteRoute,
  SlotsRoute,
} from "./games";
import { GamesRoute } from "./Games.route";
import { HelpRoute } from "./Help.route";
import { MeRoute } from "./Me.route";
import { ChatroomRoute } from "./Room.route";
import { RootRoute } from "./Root.route";
import { SigninRoute } from "./Signin.route";
import { SignoutRoute } from "./Signout.route";
import { SignupRoute } from "./Signup.route";
import { StatsRoute } from "./Stats.route";
import { userLoader, UserRoute } from "./User.route";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    errorElement: <ErrorRoute />,
    loader: async () => {
      const { rooms } = await roomListLoader();
      const users = await userListLoader();

      return {
        rooms,
        users,
      };
    },
    children: [
      {
        path: "/admin",
        loader: requireAdminLoader,
        element: <AdminRoute />,
      },
      {
        path: "/chat",
        element: <Outlet />,
        children: [
          {
            path: ":chatroomId",
            loader: roomLoader,
            element: <ChatroomRoute />,
            children: [
              {
                path: "settings",
                loader: roomSettingsLoader,
                element: <RoomSettingsRoute />,
                children: [
                  {
                    path: "blacklist",
                    loader: roomSettingsLoader,
                    element: <RoomBlacklistRoute />,
                  },
                  {
                    path: "whitelist",
                    loader: roomSettingsLoader,
                    element: <RoomWhitelistRoute />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "/games",
        loader: requireClientLoader,
        element: <GamesRoute />,
        children: [
          {
            path: "blackjack",
            element: <BlackjackRoute />,
          },
          {
            path: "crossing",
            element: <CrossingRoute />,
          },
          {
            path: "racing",
            element: <RacingRoute />,
          },
          {
            path: "roulette",
            element: <RouletteRoute />,
          },
          {
            path: "slots",
            element: <SlotsRoute />,
          },
        ],
      },
      {
        path: "/help",
        element: <HelpRoute />,
      },
      {
        path: "/me",
        loader: requireClientLoader,
        element: <MeRoute />,
      },
      {
        path: "/signin",
        loader: chatRedirectLoader,
        element: <SigninRoute />,
      },
      {
        path: "/signout",
        loader: requireClientLoader,
        element: <SignoutRoute />,
      },
      {
        path: "/signup",
        loader: chatRedirectLoader,
        element: <SignupRoute />,
      },
      {
        path: "/stats",
        element: <StatsRoute />,
      },
      {
        path: "/user/:userId",
        loader: userLoader,
        element: <UserRoute />,
      },
    ],
  },
]);
