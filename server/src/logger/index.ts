import pino from "pino";

export const createLogger = (name: string) => {
  const _pino = pino({
    name,
  });

  return {
    info: _pino.info.bind(_pino),
    error: _pino.error.bind(_pino),
    fatal: _pino.fatal.bind(_pino),
  };
};
