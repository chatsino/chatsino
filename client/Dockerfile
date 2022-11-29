FROM node:18-alpine
WORKDIR /app
COPY ./package* ./tsconfig* ./yarn.lock ./
RUN yarn install
COPY ./ ./
RUN yarn build
CMD ["mv", "./build/*", "/var/www/html"]