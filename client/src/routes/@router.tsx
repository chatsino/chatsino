import { createBrowserRouter } from "react-router-dom";
import {
  meRedirectLoader,
  requireAdminLoader,
  requireClientLoader,
} from "loaders";
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
import { SignoutRoute } from "./Signout.route";
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
        loader: requireAdminLoader,
        element: <AdminRoute />,
      },
      {
        path: "/chat",
        loader: requireClientLoader,
        element: <ChatRoute />,
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
        path: "/shop",
        loader: requireClientLoader,
        element: <ShopRoute />,
      },
      {
        path: "/signin",
        loader: meRedirectLoader,
        element: <SigninRoute />,
      },
      {
        path: "/signout",
        loader: requireClientLoader,
        element: <SignoutRoute />,
      },
      {
        path: "/signup",
        loader: meRedirectLoader,
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