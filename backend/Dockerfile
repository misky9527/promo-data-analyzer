FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY dist ./dist
EXPOSE 3003
CMD ["node", "dist/main.js"]
