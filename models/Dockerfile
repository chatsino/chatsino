FROM node:18-alpine AS install-dependencies
WORKDIR /app
COPY ./package* ./tsconfig* ./yarn.lock ./
RUN yarn install
COPY ./ ./
EXPOSE 4001
CMD ["yarn", "start:production"]
