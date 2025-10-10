#!/bin/bash
echo "Importing realm..."
/opt/keycloak/bin/kc.sh import --file /opt/keycloak/data/import/realm-export.json