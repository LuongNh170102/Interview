FROM node:20-alpine as build-stage
WORKDIR /usr/frontend
COPY . .
RUN rm -rf node_modules
RUN rm -rf package-lock.json
RUN rm -rf dist
RUN npm install --legacy-peer-deps
RUN npm run build:production 
FROM nginx:1.23.3
COPY --from=build-stage /usr/frontend/dist /usr/share/nginx/html