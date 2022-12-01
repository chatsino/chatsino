import { assignToken, issueTicket, revokeToken } from "auth";
import { Request, Response, Router } from "express";
import { errorResponse, successResponse, handleGenericErrors } from "helpers";
import { createLogger } from "logger";
import { AuthenticatedRequest } from "middleware";
import {
  ClientNotFoundError,
  ClientWithUsernameExistsError,
  createClient,
  IncorrectPasswordError,
  verifyClientPassword,
} from "persistence";
import { clientSigninSchema, clientSignupSchema } from "schemas";

export const AUTH_ROUTER_LOGGER = createLogger("Authentication");

export function createAuthRouter() {
  const authRouter = Router();

  authRouter.post("/signup", signupRoute);
  authRouter.post("/signin", signinRoute);
  authRouter.post("/signout", signoutRoute);
  authRouter.get("/validate", validateRoute);
  authRouter.get("/ticket", ticketRoute);

  return authRouter;
}

export async function validateRoute(req: AuthenticatedRequest, res: Response) {
  return successResponse(res, "Validation request succeeded.", {
    client: req.chatsinoClient,
  });
}

export async function signupRoute(req: Request, res: Response) {
  try {
    const { username, password } = await clientSignupSchema.validate(req.body);
    const client = await createClient(username, password);

    const token = await assignToken(res, client);

    return successResponse(res, "Successfully signed up.", {
      client,
      token,
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error({ error }, "A request to sign up failed.");

    if (error instanceof ClientWithUsernameExistsError) {
      return errorResponse(res, error.message);
    }

    return handleGenericErrors(res, error, "Unable to sign up.");
  }
}

export async function signinRoute(req: Request, res: Response) {
  try {
    const { username, password } = await clientSigninSchema.validate(req.body);
    const client = await verifyClientPassword(username, password);

    if (!client) {
      throw new Error();
    }

    const token = await assignToken(res, client);

    return successResponse(res, "Successfully signed in.", { client, token });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error({ error }, "A request to sign in failed.");

    if (error instanceof ClientNotFoundError) {
      return errorResponse(res, "Unable to sign in.");
    }

    if (error instanceof IncorrectPasswordError) {
      return errorResponse(res, "Incorrect password.");
    }

    return handleGenericErrors(res, error, "Unable to sign in.");
  }
}

export async function signoutRoute(req: AuthenticatedRequest, res: Response) {
  try {
    const { chatsinoClient } = req;

    if (!chatsinoClient) {
      throw new Error();
    }

    await revokeToken(res, chatsinoClient);

    return successResponse(res, "Successfully signed out.");
  } catch (error) {
    AUTH_ROUTER_LOGGER.error({ error }, "A request to sign out failed.");

    return handleGenericErrors(res, error, "Unable to sign out.");
  }
}

export async function ticketRoute(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      chatsinoClient,
      socket: { remoteAddress },
    } = req;

    if (!chatsinoClient || !remoteAddress) {
      throw new Error();
    }

    return successResponse(res, "Ticket assigned.", {
      ticket: await issueTicket(chatsinoClient.username, remoteAddress),
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error(
      { error },
      "A request to receive a ticket failed."
    );

    return handleGenericErrors(res, error, "Unable to assign ticket.");
  }
}
