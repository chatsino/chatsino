export type UserCreate = {
  avatar: string;
  username: string;
};

export class UserCannotAffordError extends Error {
  statusCode = 403;
  message = "That user cannot afford that.";
}

export class UserNotFoundError extends Error {
  statusCode = 404;
  message = "That user does not exist.";
}

export class UsernameConflictError extends Error {
  statusCode = 409;
  message = "That username is already in use.";
}
