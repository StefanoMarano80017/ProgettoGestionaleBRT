package com.brt.TimesheetService.shared.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Configurazione cache per i service che usano @Cacheable/@CacheEvict.
 *
 * IMPORTANTE: Questa configurazione è usata SOLO per: - CommessaService (dati
 * da servizio esterno, futura migrazione a Redis) - Altri service simili che
 * sincronizzano dati esterni
 *
 * TimesheetService usa cache MANUALE (gestita internamente) per avere controllo
 * granulare sull'invalidazione predicata.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("commesse", "employees");
        cacheManager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(30, TimeUnit.MINUTES) // TTL più lungo per dati esterni
                        .maximumSize(500)
                        .recordStats() // Utile per monitoring
        );

        return cacheManager;
    }

    // TODO: Quando migriamo a Redis, sostituire questo bean con:
    /*
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .withCacheConfiguration("commesse", config)
                .build();
    }
     */
}
