import type { SourcedSocketMessage } from "schemas";

export type PreparsedSourcedSocketMessage = string | SourcedSocketMessage;

export function parseSourcedSocketMessage(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  if (typeof sourcedSocketMessage === "string") {
    return JSON.parse(sourcedSocketMessage) as SourcedSocketMessage;
  } else {
    return sourcedSocketMessage;
  }
}
