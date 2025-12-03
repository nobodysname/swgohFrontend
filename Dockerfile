FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g @quasar/cli
RUN npm install

COPY . .

RUN quasar build

EXPOSE 8080

CMD ["npm", "run", "start"]
