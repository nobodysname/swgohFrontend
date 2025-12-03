FROM node:18-alpine

WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm install -g @quasar/cli
RUN npm install

# Quasar Code kopieren
COPY . .

# SPA bauen
RUN quasar build

# Container-Port
EXPOSE 80

# Frontend-Server starten
CMD ["node", "server.cjs"]
