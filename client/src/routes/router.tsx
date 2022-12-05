import { createBrowserRouter } from "react-router-dom";
import {
  BlackjackRoute,
  CrossingRoute,
  RacingRoute,
  RouletteRoute,
  SlotsRoute,
} from "./games";
import { AdminRoute } from "./Admin.route";
import { ChatRoute } from "./Chat.route";
import { ErrorRoute } from "./Error.route";
import { GamesRoute } from "./Games.route";
import { HelpRoute } from "./Help.route";
import { MeRoute } from "./Me.route";
import { RootRoute } from "./Root.route";
import { ShopRoute } from "./Shop.route";
import { SigninRoute } from "./Signin.route";
import { SignupRoute } from "./Signup.route";
import { UserRoute, userLoader } from "./User.route";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    errorElement: <ErrorRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminRoute />,
      },
      {
        path: "/chat",
        element: <ChatRoute />,
      },
      {
        path: "/games",
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
        element: <MeRoute />,
      },
      {
        path: "/shop",
        element: <ShopRoute />,
      },
      {
        path: "/signin",
        element: <SigninRoute />,
      },
      {
        path: "/signup",
        element: <SignupRoute />,
      },
      {
        path: "/signup",
        element: <SignupRoute />,
      },
      {
        path: "/u/:userId",
        loader: userLoader,
        element: <UserRoute />,
      },
    ],
  },
]);
