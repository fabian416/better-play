# Etapa 1: Build
FROM node:22-slim AS builder
LABEL com.centurylinklabs.watchtower.enable="true"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && apt-get clean && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare yarn@3.2.3 --activate


COPY . .

RUN yarn install


ARG VITE_PUBLIC_ENVIRONMENT
ENV VITE_PUBLIC_ENVIRONMENT=${VITE_PUBLIC_ENVIRONMENT:-development}
ENV VITE_WALLET_CONNECT_PROJECT_ID=8b1988f17923eace8f1ac14141db22a5
ENV VITE_BETTER_PLAY_ADDRESS=0xba235d16474614E2135EB5C6184882a9c5393960
ENV VITE_USDC_ADDRESS=0x5774741aB4b862A24D70e93740ed165eaFF8Df4a

RUN yarn build


FROM node:22-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && apt-get clean && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare yarn@3.2.3 --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./
COPY --from=builder /app/.yarnrc.yml ./


EXPOSE 3002

CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "3002"]