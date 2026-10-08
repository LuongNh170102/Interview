FROM node:24.0.0-alpine
WORKDIR /usr/backend
COPY . .
RUN rm -rf node_modules
RUN rm -rf dist
RUN rm -f package-lock.json
RUN npm install
RUN npm run build
CMD [ "npm","run", "start:production"]