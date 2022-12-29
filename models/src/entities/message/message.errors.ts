export const messageErrors = {
  ForbiddenEditError: class extends Error {
    statusCode = 403;
    message = "User does not have permission to edit that message.";
  },
  ForbiddenDeleteError: class extends Error {
    statusCode = 403;
    message = "User does not have permission to edit that message.";
  },
  NotFoundError: class extends Error {
    statusCode = 404;
    message = "That message does not exist.";
  },
  ContentConflict: class extends Error {
    statusCode = 409;
    message = "That message was recently sent.";
  },
};
