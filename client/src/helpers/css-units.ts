export function toUniversalVh(percent: number) {
  return `calc(var(--vh, 1vh) * ${percent}`;
}
