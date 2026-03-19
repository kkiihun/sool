FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
# NEXT_PUBLIC_API_URL is needed if you are doing SSG/ISR
# ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development

# Copy necessary files
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
