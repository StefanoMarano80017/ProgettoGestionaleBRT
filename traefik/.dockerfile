FROM traefik:v3.1

# Passiamo a root per usare wget
USER root
# Copiamo lo script nello container
COPY wait-for-keycloak.sh /wait-for-keycloak.sh
RUN chmod +x /wait-for-keycloak.sh

# Torniamo all'utente traefik
USER traefik