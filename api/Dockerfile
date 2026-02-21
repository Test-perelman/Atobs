FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY src ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npx tsc

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3005

CMD ["node", "dist/app.js"]
