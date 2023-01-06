import * as config from "config";
import { Request, Response, Router } from "express";
import { createLogger, handleGenericErrors, successResponse } from "helpers";
import { makeRequest, User, UserSocketRequests, userValidators } from "models";
import { issueTicket } from "tickets";

export const AUTH_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.AUTH_ROUTER);

// Router
export function createAuthRouter() {
  const authRouter = Router();

  authRouter.post("/signup", signupRoute);
  authRouter.post("/signin", signinRoute);
  authRouter.post("/signout", signoutRoute);
  authRouter.get("/validate", validateRoute);
  authRouter.get("/ticket", ticketRoute);

  return authRouter;
}

// Routes
export async function validateRoute(req: Request, res: Response) {
  try {
    const { userId = "(anonymous)" } = req.session as UserSession;
    const user = (await makeRequest(userId, UserSocketRequests.GetUser, {
      userId,
    })) as {
      user: Nullable<User>;
    };

    AUTH_ROUTER_LOGGER.info({ user }, "Retrieved user.");

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
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { avatar, username, password } = await userValidators[
      UserSocketRequests.CreateUser
    ].validate(req.body);
    const result = (await makeRequest(userId, UserSocketRequests.CreateUser, {
      avatar,
      username,
      password,
    })) as {
      user: Nullable<User>;
    };

    AUTH_ROUTER_LOGGER.info({ result }, "Result.");

    const { user } = result;

    if (!user) {
      throw new Error("Failed to create user.");
    }

    const session = req.session as UserSession;

    session.userId = user.id;

    return successResponse(res, "Successfully signed up.", {
      user,
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error({ error }, "A request to sign up failed.");

    return handleGenericErrors(res, error, "Unable to sign up.");
  }
}

export async function signinRoute(req: Request, res: Response) {
  try {
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { username, password } = await userValidators[
      UserSocketRequests.GetIsCorrectPassword
    ].validate(req.body);
    const { isCorrect } = (await makeRequest(
      userId,
      UserSocketRequests.GetIsCorrectPassword,
      {
        username,
        password,
      }
    )) as {
      isCorrect: boolean;
    };

    if (!isCorrect) {
      throw new Error();
    }

    const { user } = (await makeRequest(
      userId,
      UserSocketRequests.GetUserByUsername,
      {
        username,
      }
    )) as {
      user: Nullable<User>;
    };

    if (!user) {
      throw new Error();
    }

    const session = req.session as UserSession;
    session.userId = user.id;

    return successResponse(res, "Successfully signed in.", { user });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error: error.message },
      "A request to sign in failed."
    );

    return handleGenericErrors(res, error, "Unable to sign in.");
  }
}

export async function signoutRoute(req: Request, res: Response) {
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

export async function ticketRoute(req: Request, res: Response) {
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
