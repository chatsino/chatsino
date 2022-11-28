import { startServer } from "server";

(async () => {
  if (process.env.SCRIPT) {
    const scripts = (await import("./scripts")) as Record<
      string,
      () => unknown
    >;
    const script = scripts[process.env.SCRIPT!];

    if (!script) {
      process.exit(1);
    }

    await script();
  } else {
    await startServer();
  }
})();
