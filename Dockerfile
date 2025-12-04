FROM node:20-alpine

WORKDIR /app

# Dependencies + Projektcode kopieren, damit quasar prepare läuft
COPY package*.json ./
COPY . .

RUN npm install
RUN npx quasar build


# SPA bauen
RUN quasar build

# Container-Port
EXPOSE 443

# Frontend-Server starten
CMD ["node", "server.cjs"]
