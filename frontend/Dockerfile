# Fase 1: build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Fase 2: serve i file statici con nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Configurazione extra per SPA (React Router ecc.)
RUN rm /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/default.conf