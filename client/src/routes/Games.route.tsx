import { Outlet } from "react-router-dom";

export function GamesRoute() {
  return (
    <div>
      <h2>Games</h2>
      <Outlet />
    </div>
  );
}
