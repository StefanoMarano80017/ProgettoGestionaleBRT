package com.brt.TimesheetService.service.caching;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;

import com.brt.TimesheetService.model.TimesheetDay;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.RemovalCause;

public class TimesheetCacheManager {

    private static final Logger log = LoggerFactory.getLogger(TimesheetCacheManager.class);

    private final Cache<String, TimesheetDay> timesheetCache;
    private final Cache<RangeKey, Page<TimesheetDay>> rangeCache;
    private final Map<Long, NavigableMap<LocalDate, List<RangeInfo>>> rangeIndex;
    private final ReadWriteLock indexLock = new ReentrantReadWriteLock();

    public TimesheetCacheManager() {
        this.rangeIndex = new ConcurrentHashMap<>();

        this.timesheetCache = Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .maximumSize(1000)
                .recordStats()
                .removalListener((key, value, cause)
                        -> log.trace("Cache day rimossa: {} (causa: {})", key, cause))
                .build();

        this.rangeCache = Caffeine.newBuilder()
                .expireAfterWrite(15, TimeUnit.MINUTES)
                .maximumSize(500)
                .recordStats()
                .removalListener((RangeKey key, Page<TimesheetDay> value, RemovalCause cause) -> {
                    if (key != null) {
                        // FIX 1: Gestione sicura della rimozione dall'indice
                        try {
                            removeFromIndex(key);
                            log.trace("Cache range rimossa: {} (causa: {})", key, cause);
                        } catch (Exception e) {
                            log.error("Errore durante rimozione dall'indice per key: {}", key, e);
                        }
                    }
                })
                .build();
    }

    // ============================================================
    // CHIAVI E STRUTTURE INTERNE
    // ============================================================
    public record RangeKey(Long employeeId, LocalDate start, LocalDate end, int page, int size) {

        @Override
        public String toString() {
            return String.format("RangeKey[emp=%d, %s->%s, p%d, s%d]",
                    employeeId, start, end, page, size);
        }
    }

    private static class RangeInfo {

        final RangeKey key;
        final LocalDate startDate;
        final LocalDate endDate;

        RangeInfo(RangeKey key, LocalDate startDate, LocalDate endDate) {
            this.key = key;
            this.startDate = startDate;
            this.endDate = endDate;
        }

        boolean containsDate(LocalDate date) {
            return !date.isBefore(startDate) && !date.isAfter(endDate);
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof RangeInfo other)) {
                return false;
            }
            return Objects.equals(key, other.key);
        }

        @Override
        public int hashCode() {
            return Objects.hash(key);
        }

        @Override
        public String toString() {
            return String.format("RangeInfo[%s-%s, key=%s]", startDate, endDate, key);
        }
    }

    // ============================================================
    // GESTIONE INDICE
    // ============================================================
    public void addToIndex(RangeKey key) {
        indexLock.writeLock().lock();
        try {
            NavigableMap<LocalDate, List<RangeInfo>> employeeRanges
                    = rangeIndex.computeIfAbsent(key.employeeId(), k -> new TreeMap<>());

            RangeInfo rangeInfo = new RangeInfo(key, key.start(), key.end());

            // FIX 2: Evita duplicati nell'indice
            List<RangeInfo> rangesAtStart = employeeRanges.computeIfAbsent(key.start(), k -> new ArrayList<>());
            if (!rangesAtStart.contains(rangeInfo)) {
                rangesAtStart.add(rangeInfo);
                log.trace("Aggiunto range all'indice: {}", rangeInfo);
            }
        } finally {
            indexLock.writeLock().unlock();
        }
    }

    public void removeFromIndex(RangeKey key) {
        indexLock.writeLock().lock();
        try {
            NavigableMap<LocalDate, List<RangeInfo>> employeeRanges = rangeIndex.get(key.employeeId());
            if (employeeRanges == null) {
                return;
            }

            List<RangeInfo> ranges = employeeRanges.get(key.start());
            if (ranges != null) {
                boolean removed = ranges.removeIf(info -> info.key.equals(key));
                if (removed) {
                    log.trace("Rimosso range dall'indice: {}", key);
                }

                // Cleanup: rimuove liste vuote
                if (ranges.isEmpty()) {
                    employeeRanges.remove(key.start());
                }
            }

            // Cleanup: rimuove mappe vuote
            if (employeeRanges.isEmpty()) {
                rangeIndex.remove(key.employeeId());
            }
        } finally {
            indexLock.writeLock().unlock();
        }
    }

    // FIX 3: Metodo pubblico per cleanup manuale (utile per test/manutenzione)
    public void cleanupEmptyIndexEntries(Long employeeId) {
        indexLock.writeLock().lock();
        try {
            NavigableMap<LocalDate, List<RangeInfo>> employeeRanges = rangeIndex.get(employeeId);
            if (employeeRanges == null) {
                return;
            }

            // Rimuove tutte le liste vuote
            employeeRanges.entrySet().removeIf(entry -> entry.getValue().isEmpty());

            // Se la mappa è vuota, rimuovila dall'indice principale
            if (employeeRanges.isEmpty()) {
                rangeIndex.remove(employeeId);
            }
        } finally {
            indexLock.writeLock().unlock();
        }
    }

    private Set<RangeKey> findRangesContaining(Long employeeId, LocalDate date) {
        indexLock.readLock().lock();
        try {
            NavigableMap<LocalDate, List<RangeInfo>> employeeRanges = rangeIndex.get(employeeId);
            if (employeeRanges == null || employeeRanges.isEmpty()) {
                return Collections.emptySet();
            }

            // Trova tutti i range che potrebbero contenere questa data
            // (tutti quelli che iniziano prima o alla data specificata)
            NavigableMap<LocalDate, List<RangeInfo>> candidateRanges
                    = employeeRanges.headMap(date, true);

            Set<RangeKey> affectedKeys = new HashSet<>();
            for (List<RangeInfo> rangeList : candidateRanges.values()) {
                for (RangeInfo range : rangeList) {
                    if (range.containsDate(date)) {
                        affectedKeys.add(range.key);
                    }
                }
            }

            if (!affectedKeys.isEmpty()) {
                log.debug("Trovati {} range contenenti la data {} per employeeId {}",
                        affectedKeys.size(), date, employeeId);
            }

            return affectedKeys;
        } finally {
            indexLock.readLock().unlock();
        }
    }

    // ============================================================
    // METODI PUBBLICI PER CACHE
    // ============================================================
    public String buildDayKey(Long employeeId, LocalDate date) {
        return employeeId + "_" + date;
    }

    public RangeKey buildRangeKey(Long employeeId, LocalDate start, LocalDate end, int page, int size) {
        return new RangeKey(employeeId, start, end, page, size);
    }

    // FIX 4: Metodo combinato più sicuro
    public void invalidateDayAndRanges(Long employeeId, LocalDate date) {
        indexLock.readLock().lock();
        try {
            // Prima invalida i range
            Set<RangeKey> keysToInvalidate = findRangesContaining(employeeId, date);
            for (RangeKey key : keysToInvalidate) {
                rangeCache.invalidate(key);
                log.trace("Invalidato range cache: {}", key);
            }

            // Poi invalida il singolo giorno
            String dayKey = buildDayKey(employeeId, date);
            timesheetCache.invalidate(dayKey);
            log.trace("Invalidato day cache: {}", dayKey);
        } finally {
            indexLock.readLock().unlock();
        }
    }

    public void invalidateRangeCachesContaining(Long employeeId, LocalDate date) {
        Set<RangeKey> keysToInvalidate = findRangesContaining(employeeId, date);
        if (!keysToInvalidate.isEmpty()) {
            log.debug("Invalidazione {} range cache per employeeId {} e data {}",
                    keysToInvalidate.size(), employeeId, date);
            for (RangeKey key : keysToInvalidate) {
                rangeCache.invalidate(key);
            }
        }
    }

    // ============================================================
    // API PUBBLICA SEMPLIFICATA
    // ============================================================
    /**
     * Ottiene un giorno di timesheet se presente in cache
     */
    public Optional<TimesheetDay> getDay(Long employeeId, LocalDate date) {
        String key = buildDayKey(employeeId, date);
        TimesheetDay result = timesheetCache.getIfPresent(key);
        if (result != null) {
            log.trace("Cache HIT per day: {}", key);
        } else {
            log.trace("Cache MISS per day: {}", key);
        }
        return Optional.ofNullable(result);
    }

    /**
     * Inserisce o aggiorna un giorno nella cache
     */
    public void putDay(Long employeeId, LocalDate date, TimesheetDay day) {
        if (day == null) {
            log.warn("Tentativo di inserire null in cache per employeeId {} e data {}", employeeId, date);
            return;
        }
        String key = buildDayKey(employeeId, date);
        timesheetCache.put(key, day);
        log.trace("Inserito in cache day: {}", key);
    }

    /**
     * Invalida il giorno e tutti i range che lo contengono
     */
    public void invalidateDay(Long employeeId, LocalDate date) {
        invalidateDayAndRanges(employeeId, date);
    }

    /**
     * Ottiene un range se presente in cache
     */
    public Optional<Page<TimesheetDay>> getRange(Long employeeId, LocalDate start, LocalDate end, int page, int size) {
        RangeKey key = new RangeKey(employeeId, start, end, page, size);
        Page<TimesheetDay> result = rangeCache.getIfPresent(key);
        if (result != null) {
            log.trace("Cache HIT per range: {}", key);
        } else {
            log.trace("Cache MISS per range: {}", key);
        }
        return Optional.ofNullable(result);
    }

    /**
     * Inserisce un range nella cache e aggiorna l'indice
     */
    public void putRange(Long employeeId, LocalDate start, LocalDate end, int page, int size, Page<TimesheetDay> value) {
        if (value == null) {
            log.warn("Tentativo di inserire null in range cache per employeeId {}, range {}-{}",
                    employeeId, start, end);
            return;
        }

        RangeKey key = new RangeKey(employeeId, start, end, page, size);
        rangeCache.put(key, value);
        addToIndex(key);
        log.trace("Inserito in cache range: {}", key);
    }

    /**
     * Invalida tutte le cache per un dipendente specifico
     */
    public void invalidateAllForEmployee(Long employeeId) {
        indexLock.writeLock().lock();
        try {
            // Invalida tutti i range per questo dipendente
            NavigableMap<LocalDate, List<RangeInfo>> employeeRanges = rangeIndex.get(employeeId);
            if (employeeRanges != null) {
                Set<RangeKey> keysToInvalidate = new HashSet<>();
                for (List<RangeInfo> rangeList : employeeRanges.values()) {
                    for (RangeInfo info : rangeList) {
                        keysToInvalidate.add(info.key);
                    }
                }

                log.debug("Invalidazione totale: {} range per employeeId {}",
                        keysToInvalidate.size(), employeeId);

                for (RangeKey key : keysToInvalidate) {
                    rangeCache.invalidate(key);
                }

                // Rimuove l'indice per questo dipendente
                rangeIndex.remove(employeeId);
            }

            // Invalida tutti i day cache per questo dipendente
            // Nota: Caffeine non supporta invalidazione per prefisso,
            // quindi dobbiamo fare cleanup manuale se necessario
            timesheetCache.asMap().keySet().removeIf(key -> key.startsWith(employeeId + "_"));

            log.info("Invalidata tutta la cache per employeeId {}", employeeId);
        } finally {
            indexLock.writeLock().unlock();
        }
    }

    /**
     * Restituisce statistiche sulla cache
     */
    public CacheStats getStats() {
        return new CacheStats(
                timesheetCache.estimatedSize(),
                rangeCache.estimatedSize(),
                timesheetCache.stats().hitRate(),
                rangeCache.stats().hitRate(),
                rangeIndex.size()
        );
    }

    public record CacheStats(
            long dayCacheSize,
            long rangeCacheSize,
            double dayHitRate,
            double rangeHitRate,
            int indexedEmployees
            ) {

        @Override
        public String toString() {
            return String.format(
                    "CacheStats[days=%d (%.2f%% hit), ranges=%d (%.2f%% hit), indexed=%d]",
                    dayCacheSize, dayHitRate * 100, rangeCacheSize, rangeHitRate * 100, indexedEmployees
            );
        }
    }

    /**
     * Pulisce completamente tutte le cache (utile per test)
     */
    public void clearAll() {
        indexLock.writeLock().lock();
        try {
            timesheetCache.invalidateAll();
            rangeCache.invalidateAll();
            rangeIndex.clear();
            log.info("Tutte le cache sono state pulite");
        } finally {
            indexLock.writeLock().unlock();
        }
    }
}
