import { SUBSCRIBER } from "cache";
import { UserEntity } from "entities";
import { parseRequest, respondTo } from "../common";
import { UserRequests } from "./user.requests";
import { userValidators } from "./user.validators";

export const initializeUserHandlers = () => {
  SUBSCRIBER.subscribe(UserRequests.GetUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const validated = await userValidators[UserRequests.GetUser].validate(
        args
      );
      const user = await UserEntity.crud.read(validated.userId);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got user.",
        data: {
          user: user.fields,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get user.",
        data: {
          user: null,
        },
      });
    }
  });
};
