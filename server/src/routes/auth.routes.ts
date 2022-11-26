import { assignToken, issueTicket, revokeToken } from "auth";
import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { createLogger } from "logger";
import { AuthenticatedRequest } from "middleware";
import {
  ClientWithUsernameExistsError,
  createClient,
  verifyClientPassword,
} from "models";
import { clientSigninSchema, clientSignupSchema } from "schemas";
import { ValidationError } from "yup";

export const AUTH_ROUTER_LOGGER = createLogger("Auth Router");

export function createAuthRouter() {
  const authRouter = Router();

  authRouter.post("/signup", signupRoute);
  authRouter.post("/signin", signinRoute);
  authRouter.post("/signout", signoutRoute);
  authRouter.post("/ticket", ticketRoute);

  return authRouter;
}

export async function signupRoute(req: Request, res: Response) {
  try {
    const { username, password } = await clientSignupSchema.validate(req.body);
    const client = await createClient(username, password);

    await assignToken(res, client);

    return successResponse(res, "Successfully signed up.", {
      client,
    });
  } catch (error) {
    AUTH_ROUTER_LOGGER.error({ error }, "A request to sign up failed.");

    if (error instanceof ValidationError) {
      return errorResponse(res, error.errors.join(", "));
    }

    if (error instanceof ClientWithUsernameExistsError) {
      return errorResponse(res, error.message);
    }

    if (error instanceof Error) {
      return errorResponse(res, "Unable to sign up.");
    }
  }
}

export async function signinRoute(req: Request, res: Response) {
  try {
    const { username, password } = await clientSigninSchema.validate(req.body);
    const client = await verifyClientPassword(username, password);

    if (!client) {
      throw new Error();
    }

    await assignToken(res, client);

    return successResponse(res, "Successfully signed in.");
  } catch {
    return errorResponse(res, "Unable to sign in.");
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
  } catch {
    return errorResponse(res, "Unable to sign out.");
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
  } catch {
    return errorResponse(res, "Unable to assign ticket.");
  }
}
