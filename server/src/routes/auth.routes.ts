import { assignToken, issueTicket, revokeToken } from "auth";
import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { AuthenticatedRequest } from "middleware";
import { createClient, verifyClientPassword } from "models";
import { clientSigninSchema, clientSignupSchema } from "schemas";

export function applyAuthRoutes(api: Router) {
  const authRouter = Router();

  authRouter.get("/signup", signupRoute);
  authRouter.get("/signin", signinRoute);
  authRouter.get("/signout", signoutRoute);
  authRouter.get("/ticket", ticketRoute);

  return api.use("/auth", authRouter);
}

export async function signupRoute(req: Request, res: Response) {
  try {
    const { username, password } = await clientSignupSchema.validate(req.body);
    const client = await createClient(username, password);

    if (!client) {
      throw new Error();
    }

    await assignToken(res, client);

    return successResponse(res, "Successfully signed up.", {
      client,
    });
  } catch {
    return errorResponse(res, "Unable to sign up.");
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
    const { client } = req;

    if (!client) {
      throw new Error();
    }

    await revokeToken(res, client);

    return successResponse(res, "Successfully signed out.");
  } catch {
    return errorResponse(res, "Unable to sign out.");
  }
}

export async function ticketRoute(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      client,
      socket: { remoteAddress },
    } = req;

    if (!client || !remoteAddress) {
      throw new Error();
    }

    return successResponse(res, "Ticket assigned.", {
      ticket: await issueTicket(client.username, remoteAddress),
    });
  } catch {
    return errorResponse(res, "Unable to assign ticket.");
  }
}
