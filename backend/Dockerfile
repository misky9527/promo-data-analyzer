FROM node:22-slim
WORKDIR /app
COPY node_modules ./node_modules
COPY dist ./dist
COPY package.json ./
EXPOSE 3003
CMD ["node", "dist/main.js"]
