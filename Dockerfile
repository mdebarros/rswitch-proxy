FROM node:14.18.2-alpine as builder
RUN apk add --no-cache git python3 build-base
WORKDIR /opt/app

COPY package.json package-lock.json* /opt/app/
COPY src /opt/app/src
RUN npm install

FROM node:14.18.2-alpine
RUN apk add --no-cache git python3 g++ make
WORKDIR /opt/app

COPY package.json package-lock.json* /opt/app/
RUN npm ci --production
COPY --from=builder /opt/app .

EXPOSE 3003

CMD ["node", "src/server.js"]
