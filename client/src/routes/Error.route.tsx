import { Empty } from "antd";
import { SiteLayout } from "ui";
import { useRouteError } from "react-router-dom";

export function ErrorRoute() {
  const error = useRouteError() as { statusText: string; message: string };

  return (
    <SiteLayout>
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
