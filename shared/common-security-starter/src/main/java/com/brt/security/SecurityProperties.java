package com.brt.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public class SecurityProperties {

    /**
     * Chiave segreta per la firma del JWT. Meglio iniettata da variabile
     * d'ambiente.
     */
    private String secret;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}
