FROM node:18-alpine AS install-dependencies
WORKDIR /app/client
COPY ./client ./
RUN yarn install
WORKDIR /app/server
COPY ./server/package* ./server/tsconfig* ./server/yarn.lock ./
RUN yarn install

FROM install-dependencies AS build-client
WORKDIR /app/client
RUN yarn build
RUN cp -r ./build /app/server/public

FROM build-client AS start-server
WORKDIR /app/server
COPY ./server/.env ./.env
COPY ./server/.ssh ./.ssh
COPY ./server/src ./src
COPY ./server/dotenv.config.js ./dotenv.config.js
COPY ./server/esbuild.js ./esbuild.js
COPY ./server/jest.config.js ./jest.config.js
COPY ./server/knexfile.js ./knexfile.js
EXPOSE 3001
CMD ["yarn", "start:production"]
