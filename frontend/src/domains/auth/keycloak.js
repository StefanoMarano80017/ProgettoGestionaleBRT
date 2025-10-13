import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://keycloak.localhost/auth', 
  realm: 'traefik-realm',
  clientId: 'traefik-client',
});

export default keycloak;