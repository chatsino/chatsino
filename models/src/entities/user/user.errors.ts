import * as config from "config";

export const userErrors = {
  MinimumPasswordSizeError: class extends Error {
    statusCode = 400;
    message = `Passwords must be a minimum of ${config.MINIMUM_PASSWORD_SIZE} characters.`;
  },
  ForbiddenError: class extends Error {
    statusCode = 403;
    message = "That user is not allowed to do that.";
  },
  CannotAffordError: class extends Error {
    statusCode = 403;
    message = "That user cannot afford that.";
  },
  NotFoundError: class extends Error {
    statusCode = 404;
    message = "That user does not exist.";
  },
  UsernameConflictError: class extends Error {
    statusCode = 409;
    message = "That username is already in use.";
  },
};
