FROM node:20-alpine AS builder

WORKDIR /app

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
FROM node:20-alpine

WORKDIR /app

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
