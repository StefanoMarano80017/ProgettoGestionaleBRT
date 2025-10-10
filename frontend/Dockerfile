# Stage 1: build dell'app
FROM node:20-alpine AS build

# Settiamo la working directory
WORKDIR /app

# Copiamo package.json e package-lock.json (o yarn.lock)
COPY package*.json ./

# Installiamo le dipendenze
RUN npm install

# Copiamo tutto il resto del progetto
COPY . .

# Buildiamo l'app per produzione
RUN npm run build

# Stage 2: server leggero per servire l'app statica
FROM nginx:alpine

# Copiamo la build nella cartella servita da nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamo configurazione custom di nginx (opzionale)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Espone la porta 80
EXPOSE 80

# Comando di default
CMD ["nginx", "-g", "daemon off;"]
