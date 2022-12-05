import { SiteLayout } from "ui";
import { Outlet } from "react-router-dom";
import { navigation } from "./navigation";

export function RootRoute() {
  return (
    <SiteLayout navigation={navigation}>
      <Outlet />
    </SiteLayout>
  );
}
