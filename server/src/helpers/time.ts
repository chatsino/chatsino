/** @desc Returns Linux epoch in seconds. */
export function now() {
  return Math.floor(new Date().getTime() / 1000);
}

export function rightNow() {
  return new Date().toString();
}

/** @desc Returns seconds since a previous time in seconds. */
export function secondsSince(time: number) {
  return now() - time;
}

/** @desc Wait a specified period of time before continuing. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
