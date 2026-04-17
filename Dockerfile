# Server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .

# Client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Production
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY --from=server-build /app/server ./server

# Copy built client to server's public directory
COPY --from=client-build /app/client/dist ./server/public

# Create uploads directory
RUN mkdir -p /app/server/uploads

EXPOSE 5000

WORKDIR /app/server

ENV NODE_ENV=production

CMD ["node", "server.js"]
