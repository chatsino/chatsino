import { Empty } from "antd";
import { useRouteError } from "react-router-dom";

export function ErrorRoute() {
  const error = useRouteError() as { statusText: string; message: string };

  return (
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
  );
}
