package com.brt.TimesheetService.modules.timesheet.application.caching;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.brt.TimesheetService.modules.timesheet.domain.TimesheetDay;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.RemovalCause;

@Component
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
                .removalListener((key, value, cause) -> {
                    if (cause != RemovalCause.EXPLICIT) {
                        log.trace("Cache day auto-rimossa: {} (causa: {})", key, cause);
                    }
                })
                .build();

        this.rangeCache = Caffeine.newBuilder()
                .expireAfterWrite(15, TimeUnit.MINUTES)
                .maximumSize(500)
                .recordStats()
                .removalListener((RangeKey key, Page<TimesheetDay> value, RemovalCause cause) -> {
                    // CRITICAL FIX: Gestione asincrona per evitare deadlock
                    if (key != null && cause != RemovalCause.EXPLICIT) {
                        // Usa un thread separato per evitare deadlock con cache lock
                        CompletableFuture.runAsync(() -> {
                            try {
                                safeRemoveFromIndex(key);
                                log.trace("Cache range auto-rimossa e indicizzata: {} (causa: {})",
                                        key, cause);
                            } catch (Exception e) {
                                log.error("ERRORE CRITICO: impossibile rimuovere dall'indice "
                                        + "la key {}: {}", key, e.getMessage(), e);
                            }
                        });
                    }
                })
                .build();
    }

    // ============================================================
    // GESTIONE INDICE
    // ============================================================
    /**
     * Aggiunge un range all'indice in modo atomico e idempotente.
     */
    public void addToIndex(RangeKey key) {
        indexLock.writeLock().lock();
        try {
            NavigableMap<LocalDate, List<RangeInfo>> employeeRanges
                    = rangeIndex.computeIfAbsent(key.employeeId(), k -> new TreeMap<>());

            RangeInfo rangeInfo = new RangeInfo(key, key.start(), key.end());

            // Verifica duplicati per evitare memory leak
            List<RangeInfo> rangesAtStart
                    = employeeRanges.computeIfAbsent(key.start(), k -> new ArrayList<>());

            if (!rangesAtStart.contains(rangeInfo)) {
                rangesAtStart.add(rangeInfo);
                log.trace("Aggiunto range all'indice: {}", rangeInfo);
            } else {
                log.trace("Range già presente nell'indice, skip: {}", rangeInfo);
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

    // Metodo pubblico per cleanup manuale (utile per test/manutenzione)
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

    public TimesheetDay getOrLoadDay(Long employeeId, LocalDate date, Supplier<TimesheetDay> loader) {
        String key = buildDayKey(employeeId, date);
        return timesheetCache.get(key, k -> {
            TimesheetDay day = loader.get();
            log.trace("Cache MISS e caricata dal DB per day: {}", key);
            return day;
        });
    }

    /**
     * Invalida un giorno e tutti i range che lo contengono in modo atomico.
     */
    public void invalidateDay(Long employeeId, LocalDate date) {
        // Acquisisce entrambi i lock per operazione atomica
        indexLock.readLock().lock();
        try {
            // Step 1: Trova tutti i range da invalidare
            Set<RangeKey> keysToInvalidate = findRangesContainingUnsafe(employeeId, date);

            // Step 2: Invalida i range
            for (RangeKey key : keysToInvalidate) {
                rangeCache.invalidate(key);
                log.trace("Invalidato range cache: {}", key);
            }

            // Step 3: Invalida il singolo giorno
            String dayKey = buildDayKey(employeeId, date);
            timesheetCache.invalidate(dayKey);
            log.trace("Invalidato day cache: {}", dayKey);

        } finally {
            indexLock.readLock().unlock();
        }
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

    // ============================================================
    // CACHE ERROR HANDLING
    // ============================================================
    /**
     * Esegue un'operazione cache con retry automatico.
     */
    public <T> CacheOperationResult<T> executeCacheOperation(
            Supplier<T> operation,
            String operationName
    ) {
        int maxRetries = 2;
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                T result = operation.get();
                if (attempt > 1) {
                    log.info("Retry {} SUCCESSO per {}", attempt, operationName);
                }
                return new CacheOperationResult<>(true, result, null);
            } catch (Exception e) {
                lastException = e;
                log.warn("Tentativo {}/{} fallito per {}: {}", attempt, maxRetries, operationName, e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(100L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return new CacheOperationResult<>(false, null, e);
                    }
                }
            }
        }

        log.error("Fallimento permanente per {}", operationName, lastException);
        return new CacheOperationResult<>(false, null, lastException);
    }

    /**
     * Popola la cache con gestione errori robusta e retry asincrono.
     */
    public void safePopulateCache(Long employeeId, LocalDate date, TimesheetDay day) {
        CacheOperationResult<Void> result = executeCacheOperation(
                () -> {
                    putDay(employeeId, date, day);
                    return null;
                },
                "putDay[" + employeeId + "," + date + "]"
        );

        if (!result.isSuccess()) {
            // Fallback: schedula retry asincrono
            scheduleAsyncCacheUpdate(employeeId, date, day);
        }
    }

    /**
     * Schedula un aggiornamento asincrono della cache per retry successivi.
     */
    private void scheduleAsyncCacheUpdate(Long employeeId, LocalDate date, TimesheetDay day) {
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(5000); // Attende 5 secondi
                putDay(employeeId, date, day);
                log.info("Retry asincrono cache SUCCESSO per employeeId={}, date={}",
                        employeeId, date);
            } catch (InterruptedException e) {
                log.error("Retry asincrono cache FALLITO per employeeId={}, date={}: {}",
                        employeeId, date, e.getMessage());
                recordFailedCacheOperation(employeeId, date);
            }
        });
    }

    /**
     * Registra operazioni cache fallite per monitoring/alerting.
     */
    private void recordFailedCacheOperation(Long employeeId, LocalDate date) {
        log.error("CACHE FAILURE PERMANENTE: employeeId={}, date={} - "
                + "RICHIESTA INTERVENTO MANUALE O MONITORING", employeeId, date);
        // TODO: Integrare con sistema di alerting (email, Slack, Prometheus, etc.)
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

    /**
     * Rimuove una chiave dall'indice in modo sicuro, con retry e timeout.
     */
    private void safeRemoveFromIndex(RangeKey key) {
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Timeout di 5 secondi per acquisire il lock
                if (indexLock.writeLock().tryLock(5, TimeUnit.SECONDS)) {
                    try {
                        removeFromIndexUnsafe(key);
                        return; // Successo
                    } finally {
                        indexLock.writeLock().unlock();
                    }
                } else {
                    log.warn("Timeout acquisizione lock indice (tentativo {}/{})",
                            attempt + 1, maxRetries);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Interruzione durante rimozione dall'indice: {}", e.getMessage());
                return;
            } catch (Exception e) {
                log.error("Errore tentativo {} di rimozione dall'indice: {}",
                        attempt + 1, e.getMessage());
            }
        }

        log.error("FALLIMENTO PERMANENTE: impossibile rimuovere dall'indice la key {} "
                + "dopo {} tentativi", key, maxRetries);
    }

    /**
     * Rimuove dall'indice senza acquisire lock (chiamata DEVE essere protetta
     * da lock esterno).
     */
    private void removeFromIndexUnsafe(RangeKey key) {
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
    }

    /**
     * Trova range contenenti una data SENZA acquisire lock (uso interno).
     */
    private Set<RangeKey> findRangesContainingUnsafe(Long employeeId, LocalDate date) {
        NavigableMap<LocalDate, List<RangeInfo>> employeeRanges = rangeIndex.get(employeeId);
        if (employeeRanges == null || employeeRanges.isEmpty()) {
            return Collections.emptySet();
        }

        // Ottimizzazione: cerca solo nei range che iniziano prima o alla data
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

        return affectedKeys;
    }

    /**
     * Cleanup periodico delle entry obsolete nell'indice (da chiamare con
     * scheduled task).
     */
    @Scheduled(fixedRate = 3600000) // Ogni ora
    public void cleanupStaleIndexEntries() {
        indexLock.writeLock().lock();
        try {
            int removedEmployees = 0;
            int removedRanges = 0;

            Iterator<Map.Entry<Long, NavigableMap<LocalDate, List<RangeInfo>>>> empIterator = rangeIndex.entrySet().iterator();

            while (empIterator.hasNext()) {
                Map.Entry<Long, NavigableMap<LocalDate, List<RangeInfo>>> empEntry = empIterator.next();
                NavigableMap<LocalDate, List<RangeInfo>> employeeRanges = empEntry.getValue();

                // Rimuove liste vuote
                Iterator<Map.Entry<LocalDate, List<RangeInfo>>> rangeIterator = employeeRanges.entrySet().iterator();

                while (rangeIterator.hasNext()) {
                    Map.Entry<LocalDate, List<RangeInfo>> rangeEntry = rangeIterator.next();
                    List<RangeInfo> rangeList = rangeEntry.getValue();
                    // Rimuove range non più presenti in cache
                    rangeList.removeIf(info -> rangeCache.getIfPresent(info.key) == null);
                    if (rangeList.isEmpty()) {
                        rangeIterator.remove();
                        removedRanges++;
                    }
                }

                // Rimuove employee senza range
                if (employeeRanges.isEmpty()) {
                    empIterator.remove();
                    removedEmployees++;
                }
            }

            if (removedEmployees > 0 || removedRanges > 0) {
                log.info("Cleanup indice: rimossi {} employees e {} range obsoleti",
                        removedEmployees, removedRanges);
            }
        } finally {
            indexLock.writeLock().unlock();
        }
    }
}
