FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL=file:/data/dev.db
ENV JWT_SECRET=replace-with-a-strong-secret
ENV JWT_EXPIRES_IN=7d
ENV FRONTEND_URL=http://localhost:5173

VOLUME ["/data"]

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node src/server.js"]
