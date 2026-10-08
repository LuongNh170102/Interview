FROM node:20-alpine
WORKDIR /app
COPY . .
RUN rm -rf node_modules
RUN rm -rf package-lock.json
RUN rm -rf .next
RUN npm install
RUN npm run build_production
EXPOSE 3000 
CMD ["npm","start"]
