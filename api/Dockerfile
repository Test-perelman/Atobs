FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -qq && apt-get install -y -qq openssl && rm -rf /var/lib/apt/lists/*

# Install all deps (devDeps needed for tsc)
COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Compile TypeScript
COPY src ./src/
COPY tsconfig.json ./
RUN ./node_modules/.bin/tsc

# Production image
FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update -qq && apt-get install -y -qq openssl && rm -rf /var/lib/apt/lists/*

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Regenerate Prisma client for production runtime
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3005

CMD ["node", "dist/app.js"]
