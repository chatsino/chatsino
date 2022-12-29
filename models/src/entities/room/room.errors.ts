export const roomErrors = {
  IncorrectPasswordError: class extends Error {
    statusCode = 401;
    message = "That is the wrong password.";
  },
  UserNotAllowedError: class extends Error {
    statusCode = 401;
    message = "User is not allowed in that room.";
  },
  UserForbiddenActionError: class extends Error {
    statusCode = 403;
    message = "User cannot perform that action.";
  },
  UserForbiddenModificationError: class extends Error {
    statusCode = 403;
    message = "User cannot modify that room.";
  },
  NotFoundError: class extends Error {
    statusCode = 404;
    message = "That room does not exist.";
  },
  MessageNotFoundError: class extends Error {
    statusCode = 404;
    message = "That message does not exist in that room.";
  },
  TitleConflictError: class extends Error {
    statusCode = 409;
    message = "That room title is already in use.";
  },
};
