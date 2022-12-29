export const sniperErrors = {
  NotFoundError: class extends Error {
    statusCode = 404;
    message = "That game of sniper does not exist.";
  },
};
