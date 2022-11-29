FROM node:18-alpine AS install-dependencies
WORKDIR /app
COPY ./package* ./tsconfig* ./yarn.lock ./
RUN yarn install
COPY ./.env ./
COPY ./src ./
COPY ./dotenv.config.js ./
COPY ./esbuild.js ./
COPY ./jest.config.js ./
COPY ./knexfile.js ./
EXPOSE 3001
CMD ["yarn", "start:production"]
