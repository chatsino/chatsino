import * as config from "config";
import { Response } from "express";
import { ValidationError } from "yup";
import { createLogger } from "./logger";

export const RESPONSE_LOGGER = createLogger(config.LOGGER_NAMES.RESPONSE);

export const successResponse = (
  res: Response,
  message: string,
  data?: Record<string, unknown>
) => {
  RESPONSE_LOGGER.info({ message }, "Responding successfully.");

  return res.status(200).send({
    error: false,
    result: "OK",
    message,
    data,
  });
};

export const errorResponse = (res: Response, message: string) => {
  RESPONSE_LOGGER.info({ message }, "Responding with error.");

  return res.status(400).send({
    error: true,
    result: "Error",
    message,
  });
};

export function handleGenericErrors(
  res: Response,
  error: unknown,
  fallback: string
) {
  if (error instanceof ValidationError) {
    return errorResponse(res, error.errors.join(", "));
  }

  if (error instanceof Error) {
    return errorResponse(res, fallback);
  }
}
