FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
COPY server.js ./
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=3003
EXPOSE 5166
CMD ["node", "server.js"]
