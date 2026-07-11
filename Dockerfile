# Multi-stage build for frontend SPA
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN chmod +x node_modules/.bin/tsc
RUN npm run build
FROM   nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Support running as a non-root user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /etc/nginx/conf.d

USER nginx

EXPOSE 8080

CMD [ "nginx", "-g", "daemon off;" ]
