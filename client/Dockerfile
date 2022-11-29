FROM node:18 AS build
WORKDIR /app
COPY package* yarn.lock tsconfig.json ./
RUN yarn install
COPY public ./public
COPY src ./src
RUN yarn run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build .
COPY nginx/conf.d/localhost.conf /etc/nginx/conf.d
COPY nginx/snippets /etc/nginx/snippets
COPY nginx/ssl /etc/ssl/certs
RUN rm /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80
EXPOSE 443