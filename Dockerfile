# Multi-stage build for frontend SPA
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./

COPY . .
RUN npm run build
EXPOSE 8080
CMD [ "npm", "start" ]
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
