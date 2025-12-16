FROM node:18-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

# Fix permissions for arbitrary users (like 583)
RUN chown -R node:node /app && chmod -R 755 /app

EXPOSE 3000

CMD ["node", "server.js"]
