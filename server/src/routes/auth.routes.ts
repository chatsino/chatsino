import { issueTicket } from "auth";
import * as config from "config";
import { UserSocketRequests } from "enums";
import { Request, Response, Router } from "express";
import { errorResponse, handleGenericErrors, successResponse } from "helpers";
import { createLogger } from "logger";
import { AuthenticatedRequest } from "middleware";
import {
  ClientNotFoundError as UserNotFoundError,
  ClientWithUsernameExistsError,
  IncorrectPasswordError,
} from "models";
import { User, userValidators } from "validators";
import { makeRequest } from "_models";

export const AUTH_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.AUTH_ROUTER);

export function createAuthRouter() {
  const authRouter = Router();

  authRouter.post("/signup", signupRoute);
  authRouter.post("/signin", signinRoute);
  authRouter.post("/signout", signoutRoute);
  authRouter.get("/validate", validateRoute);
  authRouter.get("/ticket", ticketRoute);

  return authRouter;
}

export async function validateRoute(req: Request, res: Response) {
  try {
    const { userId } = req.session as UserSession;
    const user = (await makeRequest(UserSocketRequests.GetUser, {
      userId,
    })) as {
      user: Nullable<User>;
    };

    return successResponse(res, "Validation request succeeded.", {
      user,
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error: error.message },
      "A request to validate failed."
    );

    return handleGenericErrors(res, error, "Unable to validate.");
  }
}

export async function signupRoute(req: Request, res: Response) {
  try {
    const { avatar, username, password } = await userValidators[
      UserSocketRequests.CreateUser
    ].validate(req.body);
    const { user } = (await makeRequest(UserSocketRequests.CreateUser, {
      avatar,
      username,
      password,
    })) as {
      user: Nullable<User>;
    };

    if (!user) {
      throw new Error("Failed to create user.");
    }

    const session = req.session as UserSession;

    session.userId = user.id;

    return successResponse(res, "Successfully signed up.", {
      user,
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error: error.message },
      "A request to sign up failed."
    );

    if (error instanceof ClientWithUsernameExistsError) {
      return errorResponse(res, error.message);
    }

    return handleGenericErrors(res, error, "Unable to sign up.");
  }
}

export async function signinRoute(req: Request, res: Response) {
  try {
    const { userId, password } = await userValidators[
      UserSocketRequests.GetIsCorrectPassword
    ].validate(req.body);
    const { isCorrect } = (await makeRequest(UserSocketRequests.CreateUser, {
      userId,
      password,
    })) as {
      isCorrect: boolean;
    };

    if (!isCorrect) {
      throw new IncorrectPasswordError();
    }

    const user = await makeRequest(UserSocketRequests.GetUser, {
      userId,
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    const session = req.session as UserSession;
    session.userId = userId;

    return successResponse(res, "Successfully signed in.", { user });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error: error.message },
      "A request to sign in failed."
    );

    if (error instanceof IncorrectPasswordError) {
      return errorResponse(res, "Incorrect password.");
    }

    return handleGenericErrors(res, error, "Unable to sign in.");
  }
}

export async function signoutRoute(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.session as UserSession;

    if (!userId) {
      throw new Error();
    }

    await new Promise<void>((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve()))
    );

    return successResponse(res, "Successfully signed out.");
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error: error.message },
      "A request to signout failed."
    );

    return handleGenericErrors(res, error, "Unable to sign out.");
  }
}

export async function ticketRoute(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.session as UserSession;
    const { remoteAddress } = req.socket;

    if (!userId || !remoteAddress) {
      throw new Error("Invalid ticket request.");
    }

    return successResponse(res, "Ticket assigned.", {
      ticket: await issueTicket(userId, remoteAddress),
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error: error.message },
      "A request to receive a ticket failed."
    );

    return handleGenericErrors(res, error, "Unable to assign ticket.");
  }
}
