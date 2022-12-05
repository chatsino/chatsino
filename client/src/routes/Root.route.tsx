import { SiteLayout } from "ui";
import { Outlet } from "react-router-dom";

export function RootRoute() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}
