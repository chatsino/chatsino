import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";

export function userLoader({ params }: LoaderFunctionArgs) {
  const { userId } = params as { userId: string };
  const users: Record<string, { name: string }> = {
    1: {
      name: "Bob",
    },
  };
  const user = users[userId] ?? null;

  return { user };
}

export function UserRoute() {
  const { user } = useLoaderData() as { user: { name: string } | null };

  return <div>{user ? <>User {user.name}</> : <>No user</>}</div>;
}
