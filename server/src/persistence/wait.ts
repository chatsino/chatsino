import * as config from "config";
import waitPort from "wait-port";

export function waitForDatabaseAndCache() {
  return Promise.all([
    waitPort({
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
      output: "silent",
    }),
    waitPort({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      output: "silent",
    }),
    waitPort({
      host: config.MODELS_HOST,
      port: config.MODELS_PORT,
      output: "silent",
    }),
  ]);
}
