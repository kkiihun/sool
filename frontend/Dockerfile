FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN if [ -f scripts/write-git-env.mjs ]; then node scripts/write-git-env.mjs; fi || true

EXPOSE 3000

CMD ["npm", "run", "dev"]
