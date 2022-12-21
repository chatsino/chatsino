export const capitalize = (word: string) =>
  [word[0].toUpperCase(), ...word.slice(1)].join("");

export const buildCacheKey = (...args: (string | number)[]) => args.join("/");
