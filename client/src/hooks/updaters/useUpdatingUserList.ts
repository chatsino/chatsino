import { ClientSocketRequests } from "enums";
import { useSocket } from "hooks";
import { UserListLoaderData } from "loaders";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router-dom";

export function useUpdatingUserList() {
  const {
    users: { active: initialActive, inactive: initialInactive },
  } = useLoaderData() as { users: UserListLoaderData };
  const { subscribe, unsubscribe } = useSocket();
  const [active, setActive] = useState(initialActive);
  const [inactive, setInactive] = useState(initialInactive);

  useEffect(() => {
    const subscription = ClientSocketRequests.UserListUpdated;

    subscribe(useUpdatingUserList.name, subscription, (response) => {
      const { active: updatedActive, inactive: updatedInactive } =
        response.data as {
          active: ChatUserData[];
          inactive: ChatUserData[];
        };

      setActive(updatedActive);
      setInactive(updatedInactive);
    });

    return () => {
      unsubscribe(useUpdatingUserList.name, subscription);
    };
  }, [subscribe, unsubscribe]);

  return { active, inactive };
}
