## CONTESTO PROGETTO COMPLETO – SISTEMA MICROSERVIZI CON AUTENTICAZIONE CENTRALIZZATA

Sto progettando una piattaforma aziendale self-hosted per un’azienda di medie dimensioni (50–100 dipendenti), basata su **microservizi containerizzati (Docker/Docker Compose o Kubernetes)**. Tutto il contesto di progetto deve essere considerato in ogni risposta.  

---

### 1. ARCHITETTURA GENERALE
- Microservizi REST indipendenti:
  - `users-service` (anagrafica, cache minima dell’utente)
  - `timesheet-service`
  - `projects-service`
  - `notifications-service` (realtime + persistenti)
- Ogni microservizio ha il proprio database (PostgreSQL / MariaDB)
- Tutte le richieste client passano attraverso un **API Gateway** (Traefik/Kong/NGINX):
  - Verifica JWT tramite chiave pubblica Keycloak (JWKS endpoint)
  - Aggiunge header standardizzati: `X-User-ID`, `X-User-Role`
  - Eventuale rate limiting, logging, tracing
- **Backend For Frontend (BFF)**:
  - Servizio Node.js intermedio tra il frontend e i microservizi
  - Gestisce autenticazione, refresh token e sessioni utente
  - Comunica con Keycloak via API OpenID Connect (token endpoint, introspection, refresh)
  - Espone endpoint semplificati e sicuri per il frontend
  - Caching temporaneo di token e profili utente
  - Interfaccia uniforme verso microservizi, evitando al frontend di gestire logica OIDC

---

### 2. AUTENTICAZIONE E AUTORIZZAZIONE
- Identity Provider: **Keycloak self-hosted** (container)
- Il **BFF** è il punto centrale della logica di autenticazione:
  - Riceve le credenziali o il codice OIDC dal frontend
  - Richiede access e refresh token a Keycloak
  - Gestisce rotazione e rinnovo automatico dei token
  - Espone al frontend sessioni sicure (es. cookie httpOnly + access token temporaneo)
  - Effettua logout, refresh e revoca token lato server
- JWT access token:
  - Breve TTL (5–15 minuti)
  - Firmato RS256
  - Claims: `sub`, `username`, `role`, `exp`, `iat`, `jti`
- Refresh token:
  - Stateful e persistente in Keycloak
  - Gestito dal BFF, mai esposto al browser
  - Rotazione e invalidazione gestite in modo sicuro
- RBAC:
  - Ruoli definiti in Keycloak (admin, manager, employee, ecc.)
  - BFF e microservizi applicano autorizzazione basata su ruoli e claims

---

### 3. EVENTI E SINCRONIZZAZIONE
- Event-driven per cache e notifiche:
  - Event Bus / Message Broker: RabbitMQ o Kafka
  - Eventi principali:
    - `user.updated`, `role.changed` → microservizi aggiornano cache minima
    - `project.updated` → sincronizzazione stato locale
    - `notification.created` → notification service invia notifiche
- Notification Service:
  - Riceve eventi
  - Memorizza notifiche nel DB
  - Espone endpoint REST `/notifications`
  - WebSocket / long polling per realtime

---

### 4. MONITORAGGIO E MANUTENZIONE
- Metriche:
  - Token emessi, refresh riusciti/falliti, revoche
  - Errori di autenticazione nel BFF
  - Statistiche sui flussi login/refresh
- Job batch (cron):
  - Pulizia refresh token scaduti
- Key rotation:
  - Gestita da Keycloak
  - BFF e microservizi aggiornano JWKS periodicamente
- Logging sicuro:
  - Mai loggare token completi, solo metadata (jti, sub, exp)

---

### 5. TECNOLOGIE PRINCIPALI
| Componente                | Tecnologia / Scelta                                     |
|---------------------------|--------------------------------------------------------|
| Identity Provider         | Keycloak (Docker container)                            |
| API Gateway               | Traefik / Kong / NGINX                                 |
| **BFF / Middleware**      | Node.js (Express / Fastify)                            |
| Event Bus / Broker        | RabbitMQ o Kafka                                       |
| Microservizi REST         | Node.js / Python / Java                                |
| Database microservizi     | PostgreSQL / MariaDB                                   |
| Database Keycloak         | PostgreSQL                                             |
| Notifiche realtime        | WebSocket (Socket.IO / FastAPI WebSocket)              |
| Monitoring                | Prometheus + Grafana                                   |
| Logging                   | Loki / ELK Stack                                       |
| Deployment                | Docker Compose / Kubernetes                            |

---

### 6. SICUREZZA E BEST PRACTICE
- HTTPS obbligatorio end-to-end
- JWT firmati RS256, validati da gateway e BFF
- Refresh token mai esposto al client, solo nel BFF
- Access token con TTL breve
- Cookie httpOnly per sessione frontend↔BFF
- Meccanismo di revoca e blacklist opzionale
- Rotazione chiavi periodica (Key rotation)
- Rate limiting su login e refresh per mitigare brute force

---

### 7. FLUSSI CHIAVE
- **Login:**  
  Frontend → BFF → Keycloak → access + refresh token → sessione utente nel BFF  
- **Accesso ai microservizi:**  
  Frontend → BFF → Gateway → microservizi  
  (BFF aggiunge JWT valido alle richieste)
- **Refresh token:**  
  BFF → Keycloak → nuovo access + refresh token → aggiorna sessione
- **Logout / revoca:**  
  BFF → Keycloak → invalidazione token attivi
- **Notifiche:**  
  Microservizi → Event Bus → Notification Service → frontend via WebSocket
- **Sync cache utenti:**  
  `user.updated` / `role.changed` → microservizi aggiornano cache minima

---

### 8. OBIETTIVO DEL PROGETTO
- Sistema centralizzato di autenticazione/authorization **self-hosted**, con:
  - UX fluida (login minimo)
  - Sicurezza gestita lato server (BFF)
  - Gestione RBAC dinamica
  - Revoca e rotation dei token
  - Metriche e monitoraggio centralizzati
  - Notifiche realtime e persistenti
  - Microservizi REST indipendenti ma coordinati via Event Bus
  - Deploy semplice via Docker Compose o Kubernetes

---

Tutte le risposte future devono **tenere in considerazione questo contesto**, comprese scelte tecnologiche, flussi, sicurezza, RBAC, JWT/refresh token, eventi e notifiche.

