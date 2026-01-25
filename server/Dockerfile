# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
