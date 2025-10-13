#!/bin/sh
set -e

echo "Waiting for Keycloak to be ready..."
# Fino a quando l'endpoint non risponde, aspetta
until wget -qO- http://keycloak:8080/realms/traefik-realm/protocol/openid-connect/certs > /dev/null 2>&1; do
  echo "Keycloak not ready yet..."
  sleep 2
done

echo "Keycloak is ready, starting Traefik..."
exec traefik "$@"
