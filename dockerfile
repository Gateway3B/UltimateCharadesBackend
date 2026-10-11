FROM node:16.17.1-alpine AS build-step

RUN mkdir -p /app

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci --legacy-peer-deps

COPY . /app

RUN npm run tsc

CMD ["npm", "start"]
