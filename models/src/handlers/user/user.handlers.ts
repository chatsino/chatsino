import { PUBLISHER, SUBSCRIBER } from "cache";
import { UserEntity, UserRole } from "entities";
import { parseRequest, respondTo } from "../common";
import { UserEvents } from "./user.events";
import { UserRequests } from "./user.requests";
import { userValidators } from "./user.validators";

export const initializeUserHandlers = () => {
  // Queries
  SUBSCRIBER.subscribe(UserRequests.GetUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const validated = await userValidators[UserRequests.GetUser].validate(
        args
      );
      const user = await UserEntity.queries.user(validated.userId);

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
  SUBSCRIBER.subscribe(UserRequests.GetAllUsers, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      const users = await UserEntity.queries.allUsers();

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all users.",
        data: {
          users: users.map((user) => user.fields),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all users.",
        data: {
          users: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetTotalUsers, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got total users.",
        data: {
          total: await UserEntity.queries.totalUsers(),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get total users.",
        data: {
          total: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetUserByUsername, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { username } = await userValidators[
        UserRequests.GetUserByUsername
      ].validate(args);
      const user = await UserEntity.queries.userByUsername(username);

      return respondTo(socketId, kind, {
        error: false,
        message: user
          ? "Successfully got user by username."
          : "There is no such user with that username.",
        data: {
          user: user ? user.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get user by username.",
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetUsersByUsernameList, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { usernames } = await userValidators[
        UserRequests.GetUsersByUsernameList
      ].validate(args);
      const users = await UserEntity.queries.usersByUsernameList(...usernames);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got users by username list.",
        data: {
          users: users.map((user) => user.fields),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get users by username list.",
        data: {
          users: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetAllModerators, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      const moderators = await UserEntity.queries.allModerators();

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all moderators.",
        data: {
          moderators: moderators.map((moderator) => moderator.fields),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all moderators.",
        data: {
          moderators: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetAllAdministrators, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      const administrators = await UserEntity.queries.allAdministrators();

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all administrators.",
        data: {
          administrators: administrators.map(
            (administrators) => administrators.fields
          ),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all administrators.",
        data: {
          administrators: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetAllOperators, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      const operators = await UserEntity.queries.allOperators();

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all operators.",
        data: {
          operators: operators.map((operators) => operators.fields),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all operators.",
        data: {
          operators: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetBannedUsers, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      const users = await UserEntity.queries.bannedUsers();

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got all banned users.",
        data: {
          users: users.map((user) => user.fields),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get all banned users.",
        data: {
          users: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetCanUserAfford, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { userId, amount } = await userValidators[
        UserRequests.GetCanUserAfford
      ].validate(args);
      const canAfford = await UserEntity.queries.canUserAfford(userId, amount);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got can user afford.",
        data: {
          canAfford,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get can user afford.",
        data: {
          canAfford: false,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.GetIsCorrectPassword, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { userId, password } = await userValidators[
        UserRequests.GetIsCorrectPassword
      ].validate(args);
      const isCorrect = await UserEntity.queries.isCorrectPassword(
        userId,
        password
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got is correct password.",
        data: {
          isCorrect,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get is correct password.",
        data: {
          isCorrect: false,
        },
      });
    }
  });
  // Mutations
  SUBSCRIBER.subscribe(UserRequests.CreateUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const userCreate = await userValidators[UserRequests.CreateUser].validate(
        args
      );
      const user = await UserEntity.mutations.createUser(userCreate);

      await PUBLISHER.publish(
        UserEvents.UserCreated,
        JSON.stringify({
          user,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully created a user.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.ReassignUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { modifyingUserId, modifiedUserId, role } = await userValidators[
        UserRequests.ReassignUser
      ].validate(args);
      const user = await UserEntity.mutations.reassignUser(
        modifyingUserId,
        modifiedUserId,
        role as UserRole
      );

      await PUBLISHER.publish(
        UserEvents.UserChanged,
        JSON.stringify({
          user,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully reassigned a user's role.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.TempbanUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { modifyingUserId, modifiedUserId, duration } =
        await userValidators[UserRequests.TempbanUser].validate(args);
      const user = await UserEntity.mutations.tempbanUser(
        modifyingUserId,
        modifiedUserId,
        duration
      );

      await PUBLISHER.publish(
        UserEvents.UserChanged,
        JSON.stringify({
          user,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully temporarily banned a user.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.PermabanUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { modifyingUserId, modifiedUserId } = await userValidators[
        UserRequests.TempbanUser
      ].validate(args);
      const user = await UserEntity.mutations.permabanUser(
        modifyingUserId,
        modifiedUserId
      );

      await PUBLISHER.publish(
        UserEvents.UserChanged,
        JSON.stringify({
          user,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully permanently banned a user.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.ChargeUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { userId, amount } = await userValidators[
        UserRequests.ChargeUser
      ].validate(args);
      const user = await UserEntity.mutations.chargeUser(userId, amount);

      await PUBLISHER.publish(
        UserEvents.UserChanged,
        JSON.stringify({
          user,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully charged a user.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.PayUser, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { userId, amount } = await userValidators[
        UserRequests.PayUser
      ].validate(args);
      const user = await UserEntity.mutations.payUser(userId, amount);

      await PUBLISHER.publish(
        UserEvents.UserChanged,
        JSON.stringify({
          user,
        })
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully paid a user.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(UserRequests.ChangeUserPassword, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { modifyingUserId, modifiedUserId, password } =
        await userValidators[UserRequests.ChangeUserPassword].validate(args);
      const user = await UserEntity.mutations.changeUserPassword(
        modifyingUserId,
        modifiedUserId,
        password
      );

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully paid a user.",
        data: {
          user,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: error.message,
        data: {
          user: null,
        },
      });
    }
  });
};
