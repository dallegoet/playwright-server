FROM node:21 as builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml /app/
RUN pnpm install
COPY . /app/
RUN pnpm build

FROM mcr.microsoft.com/playwright:v1.39.0-jammy

RUN npm install -g pnpm

ARG TARGETARCH

ENV TINI_VERSION v0.19.0
ENV GOSU_VERSION 1.12

ENV PORT=3000

ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${TARGETARCH} /usr/local/bin/tini
RUN chmod +x /usr/local/bin/tini

ADD https://github.com/tianon/gosu/releases/download/${GOSU_VERSION}/gosu-${TARGETARCH} /usr/local/bin/gosu
RUN chmod +x /usr/local/bin/gosu

WORKDIR /usr/local/app
COPY package.json pnpm-lock.yaml /usr/local/app/
RUN pnpm install --production
COPY --from=builder /app/dist /usr/local/app/dist
COPY extensions ./extensions

ENTRYPOINT ["/usr/local/bin/tini", "-g", "--"]

EXPOSE $PORT

CMD ["gosu", "pwuser", "node", "dist/index.js"]