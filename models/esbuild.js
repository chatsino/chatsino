require("./dotenv.config");
const path = require("path");
const { build } = require("esbuild");
const package = require("./package.json");

const options = {
  entryPoints: ["./src"],
  platform: "node",
  outfile: path.resolve(__dirname, "./build/models.js"),
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV ?? "development"}"`,
    "process.env.VERSION": `"${package.version}"`,
    "process.env.PORT": process.env.PORT,
    "process.env.REDIS_HOST": `"${process.env.REDIS_HOST}"`,
    "process.env.REDIS_CONNECTION_STRING": `"${process.env.REDIS_CONNECTION_STRING}"`,
  },
};

build(options).catch(() => process.exit(1));
