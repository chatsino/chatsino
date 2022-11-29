console.info("Remaining open for Docker exploration.");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  while (true) {
    await sleep(10000);
  }
})();
