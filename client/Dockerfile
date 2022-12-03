FROM node:18 AS build
WORKDIR /app
COPY package* yarn.lock tsconfig.json ./
RUN yarn install
COPY public ./public
COPY src ./src
RUN yarn run build

FROM caddy:latest
COPY --from=build /app/build /static