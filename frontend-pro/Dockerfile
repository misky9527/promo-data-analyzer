# Stage 1: 构建
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx max build

# Stage 2: 运行（只装 server.js 需要的，虽然它是纯 Node，但保留 node 运行时即可）
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js ./
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=3003
EXPOSE 5166
CMD ["node", "server.js"]
