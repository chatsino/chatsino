import { Response } from "express";
import { ValidationError } from "yup";

export const successResponse = (
  res: Response,
  message: string,
  data?: Record<string, unknown>
) =>
  res.status(200).send({
    error: false,
    result: "OK",
    message,
    data,
  });

export const errorResponse = (res: Response, message: string) =>
  res.status(400).send({
    error: true,
    result: "Error",
    message,
  });

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
