import * as config from "config";
import { UserSocketRequests } from "enums";
import {
  parseSourcedSocketMessage,
  PreparsedSourcedSocketMessage,
} from "helpers";
import { createLogger } from "logger";
import { SUBSCRIBER } from "persistence";

export type UserCreate = {
  avatar: string;
  username: string;
  password: string;
};

export const USER_MANAGER_LOGGER = createLogger(
  config.LOGGER_NAMES.USER_MANAGER
);

export function initializeUserManager() {
  SUBSCRIBER.subscribe(UserSocketRequests.CreateUser, handleCreateUser);
}

export async function handleCreateUser(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
  } catch (error) {
    return handleUserErrors(error);
  }
}

export function handleUserErrors(error: unknown) {}
