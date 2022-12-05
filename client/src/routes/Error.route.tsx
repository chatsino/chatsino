import { Empty } from "antd";
import { SiteLayout } from "ui";
import { useRouteError } from "react-router-dom";
import { navigation } from "./navigation";

export function ErrorRoute() {
  const error = useRouteError() as { statusText: string; message: string };

  return (
    <SiteLayout navigation={navigation}>
      <Empty
        description={
          <div>
            <h2>Error</h2>
            <p>
              <i>{error.statusText || error.message}</i>
            </p>
          </div>
        }
      />
    </SiteLayout>
  );
}
