FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production
ENV PORT=5000
ENV JWT_SECRET=replace-with-a-strong-secret
ENV JWT_EXPIRES_IN=7d
ENV FRONTEND_URL=http://localhost:5173

EXPOSE 5000

CMD ["node", "scripts/start-container.mjs"]
