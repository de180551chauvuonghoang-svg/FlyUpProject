FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt OpenSSL cần thiết cho Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt dependencies và sinh Prisma Client
RUN npm ci
RUN npx prisma generate

COPY . .

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/index.js"]
