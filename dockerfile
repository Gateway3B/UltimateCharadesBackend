FROM node:16.17.1-alpine AS build-step

RUN mkdir -p /app

WORKDIR /app

COPY package.json /app

RUN npm install --legacy-peer-dep

COPY . /app

RUN npm run tsc

CMD ["npm", "start"]