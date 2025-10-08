package com.brt.TimesheetService.modules.timesheet.application;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.brt.TimesheetService.modules.timesheet.application.caching.TimesheetCacheManager;
import com.brt.TimesheetService.modules.timesheet.application.validator.OperationContext;
import com.brt.TimesheetService.modules.timesheet.application.validator.TimesheetValidator;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetDay;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetItem;
import com.brt.TimesheetService.modules.timesheet.infrastructure.TimesheetDayRepository;
import com.brt.TimesheetService.modules.user.domain.Employee;
import com.brt.TimesheetService.modules.user.infrastructure.EmployeeRepository;
import com.brt.TimesheetService.shared.exception.ResourceNotFoundException;
import com.brt.TimesheetService.shared.exception.TimesheetValidationException;
import com.brt.TimesheetService.shared.projection.TimesheetDayProjection;

public abstract class BaseTimesheetService {

    // Lock map per sincronizzazione granulare
    private final ConcurrentMap<String, Object> locks = new ConcurrentHashMap<>();
    private static final Logger log = LoggerFactory.getLogger(TimesheetApplicationService.class);

    protected final TimesheetDayRepository timesheetDayRepository;
    protected final EmployeeRepository employeeRepository;
    protected final TimesheetValidator validator;
    protected final TimesheetCacheManager cacheManager;

    protected BaseTimesheetService(
            TimesheetDayRepository timesheetDayRepository,
            TimesheetValidator validator,
            TimesheetCacheManager cacheManager, // Inject invece di new
            EmployeeRepository employeeRepository
    ) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.employeeRepository = employeeRepository;
        this.validator = validator;
        this.cacheManager = cacheManager;
    }

    // ============================================================
    // MECCANISMO DI LOCKING
    // ============================================================
    /**
     * Esegue un'operazione dentro un lock specifico per la chiave. Il lock
     * viene rimosso automaticamente dopo l'uso per evitare memory leak.
     */
    protected <R> R withLock(String key, Supplier<R> supplier) {
        Object lock = locks.computeIfAbsent(key, k -> new Object());
        synchronized (lock) {
            try {
                log.trace("Lock acquisito: {}", key);
                return supplier.get();
            } finally {
                locks.remove(key, lock);
                log.trace("Lock rilasciato: {}", key);
            }
        }
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================
    protected Employee getEmployeeOrThrow(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Dipendente non trovato (ID: " + employeeId + ")"));
    }

    protected TimesheetDay getTimesheetDayOrThrow(Employee employee, LocalDate date) {
        return timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Timesheet non trovato per employeeId=" + employee.getId()
                + " il giorno " + date));
    }

    protected boolean isTimesheetDayExists(Employee employee, LocalDate date) {
        return timesheetDayRepository.existsByEmployeeAndDate(employee, date);
    }

    /**
     * Carica un TimesheetDay dalla cache o dal DB con gestione cache stampede.
     *
     * PATTERN: Double-checked locking 1. Check cache (fast path, no lock) 2.
     * Acquire lock 3. Re-check cache (altro thread potrebbe averla popolata) 4.
     * Load da DB se ancora assente 5. Popola cache DENTRO il lock
     *
     * GARANTISCE: Nessun cache stampede, single DB call per cache miss
     * concorrenti
     */
    protected TimesheetDay getOrLoadTimesheetDay(Employee employee, LocalDate date) {
        Long employeeId = employee.getId();
        // Prima verifica senza lock (fast path per cache hit)
        Optional<TimesheetDay> cached = cacheManager.getDay(employeeId, date);
        if (cached.isPresent()) {
            log.trace("Cache HIT per employeeId={}, date={}", employeeId, date);
            return cached.get();
        }
        // Cache miss: acquisisce lock per evitare cache stampede
        String lockKey = employeeId + "_" + date;
        return withLock(lockKey, () -> {
            // Seconda verifica con lock (double-checked locking)
            Optional<TimesheetDay> recheckCache = cacheManager.getDay(employeeId, date);
            if (recheckCache.isPresent()) {
                log.trace("Cache HIT su second check per employeeId={}, date={}",
                        employeeId, date);
                return recheckCache.get();
            }
            // Carica dal DB
            log.debug("Cache MISS definitivo, loading da DB per employeeId={}, date={}", employeeId, date);
            TimesheetDay day = getTimesheetDayOrThrow(employee, date);
            // Popola la cache DENTRO il lock (atomico)
            cacheManager.safePopulateCache(employeeId, date, day);
            return day;
        });
    }

    // ============================================================
    // TEMPLATE METHODS
    // ============================================================
    /**
     * Template per esecuzione sicura con logging e error handling.
     */
    protected <R> R executeSafely(String opName, Supplier<R> operation) {
        log.info("[{}] START", opName);
        long start = System.currentTimeMillis();
        try {
            R result = operation.get();
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] SUCCESS in {} ms", opName, duration);
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("[{}] FAILED after {} ms: {}", opName, duration, e.getMessage(), e);
            throw new TimesheetValidationException("Errore in " + opName + ": " + e.getMessage(), e);
        }
    }

    /**
     * Template per operazioni READ-ONLY con caching.
     *
     * PATTERN: Try cache -> Lock -> Fresh read -> Validate -> Populate cache
     */
    protected TimesheetDayProjection executeOnTimesheetReadOnly(
            Long employeeId,
            LocalDate date,
            OperationContext context,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            // Usa getOrLoadTimesheetDay che implementa double-checked locking
            TimesheetDay day = getOrLoadTimesheetDay(employee, date);
            // Validazione (non modifica stato, safe anche fuori dal lock)
            validator.validateRules(day, context, employee);
            return TimesheetDayProjection.fromEntity(day);
        });
    }

    /**
     * Template per operazioni WRITE su timesheet esistente.
     *
     * PATTERN: Lock -> Fresh read -> Validate -> Invalidate -> Modify -> Save
     * -> Cache
     *
     * GARANTISCE: - Nessuna race condition (tutto dentro lock) - Fresh state
     * dal DB - Cache consistency (invalidate prima, populate dopo save)
     */
    protected TimesheetDayProjection executeOnTimesheet(
            Long employeeId,
            LocalDate date,
            OperationContext context,
            BiFunction<TimesheetDay, Employee, TimesheetDay> operation,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            String lockKey = employeeId + "_" + date;
            return withLock(lockKey, () -> {
                // CRITICAL: Fresh read dal DB DENTRO il lock
                TimesheetDay day = getTimesheetDayOrThrow(employee, date);
                // Validazione con stato fresco
                validator.validateRules(day, context, employee);
                // Invalida cache PRIMA della modifica 
                cacheManager.invalidateDay(employeeId, date);
                log.trace("[{}] Cache invalidata per employeeId={}, date={}", opName, employeeId, date);
                // Esegue la modifica
                TimesheetDay modifiedDay = operation.apply(day, employee);
                // Salva nel DB
                TimesheetDay savedDay = timesheetDayRepository.save(modifiedDay);
                log.debug("[{}] Day salvato su DB per employeeId={}, date={}", opName, employeeId, date);
                // Ripopola cache con dati salvati (dentro lock)
                cacheManager.safePopulateCache(employeeId, date, savedDay);
                // Invalida range cache FUORI dal critica path per performance
                CompletableFuture.runAsync(() -> {
                    try {
                        cacheManager.invalidateRangeCachesContaining(employeeId, date);
                        log.trace("[{}] Range cache invalidate per date={}", opName, date);
                    } catch (Exception e) {
                        log.warn("[{}] Fallita invalidazione range cache: {}",
                                opName, e.getMessage());
                    }
                });
                return TimesheetDayProjection.fromEntity(savedDay);
            });
        });
    }

    /**
     * Template per creazione NUOVO timesheet.
     *
     * PATTERN: Check existence -> Lock -> Re-check -> Create -> Validate ->
     * Save -> Cache
     */
    protected TimesheetDayProjection executeOnNewTimesheet(
            Long employeeId,
            LocalDate date,
            OperationContext context,
            BiFunction<TimesheetDay, Employee, TimesheetDay> operation,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            String lockKey = employeeId + "_" + date;
            return withLock(lockKey, () -> {
                // Re-check existence dentro il lock (double-check)
                if (isTimesheetDayExists(employee, date)) {
                    throw new IllegalStateException(
                            "Il timesheet esiste già per employeeId=" + employeeId
                            + " il giorno " + date);
                }
                // Crea nuovo day
                TimesheetDay day = TimesheetDay.builder()
                        .employee(employee)
                        .date(date)
                        .build();
                // Validazione
                validator.validateRules(day, context, employee);
                // Esegue l'operazione di inizializzazione
                TimesheetDay modifiedDay = operation.apply(day, employee);
                // Salva
                TimesheetDay savedDay = timesheetDayRepository.save(modifiedDay);
                log.debug("[{}] Nuovo day creato per employeeId={}, date={}", opName, employeeId, date);
                // Popola cache
                cacheManager.safePopulateCache(employeeId, date, savedDay);
                // Invalida range cache in modo asincrono
                CompletableFuture.runAsync(() -> {
                    try {
                        cacheManager.invalidateRangeCachesContaining(employeeId, date);
                    } catch (Exception e) {
                        log.warn("[{}] Fallita invalidazione range cache: {}",
                                opName, e.getMessage());
                    }
                });
                return TimesheetDayProjection.fromEntity(savedDay);
            });
        });
    }

    /**
     * Template per query paginate con range caching.
     */
    protected <R> Page<R> executeOnTimesheetPaged(
            Long employeeId,
            Pageable pageable,
            Function<TimesheetDay, R> mapper,
            BiFunction<Employee, Pageable, Page<TimesheetDay>> queryFn,
            LocalDate startDate,
            LocalDate endDate,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);

            // Prova a recuperare dalla cache
            return cacheManager
                    .getRange(employeeId, startDate, endDate,
                            pageable.getPageNumber(), pageable.getPageSize())
                    .map(page -> page.map(mapper))
                    .orElseGet(() -> {
                        // Cache miss: recupera dal repository
                        Page<TimesheetDay> newPage = queryFn.apply(employee, pageable);
                        // Salva nella cache (best-effort, non blocca su errore)
                        try {
                            cacheManager.putRange(employeeId, startDate, endDate,
                                    pageable.getPageNumber(), pageable.getPageSize(), newPage);
                        } catch (Exception e) {
                            log.warn("[{}] Fallita scrittura range cache: {}",
                                    opName, e.getMessage());
                        }
                        return newPage.map(mapper);
                    });
        });
    }

    /**
     * Template per operazioni su TimesheetItem con validazione ownership.
     *
     * PATTERN: Lock -> Fresh read -> Validate + Ownership -> Invalidate ->
     * Modify -> Save -> Cache
     *
     * SECURITY: Verifica esplicita che l'item appartenga al day corretto
     */
    protected TimesheetDayProjection executeOnTimesheetItem(
            Long employeeId,
            LocalDate date,
            Long itemId,
            OperationContext context,
            BiFunction<TimesheetDay, TimesheetItem, TimesheetItem> operation,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);

            String lockKey = employeeId + "_" + date;
            return withLock(lockKey, () -> {
                // Fresh read dal DB
                TimesheetDay day = getTimesheetDayOrThrow(employee, date);
                // Validazione globale
                validator.validateRules(day, context, employee);
                // Recupera e valida l'item specifico
                TimesheetItem item;
                if (itemId != null) {
                    item = day.getItems().stream()
                            .filter(i -> i.getId().equals(itemId))
                            .findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException(
                            "TimesheetItem non trovato: " + itemId));
                    // SECURITY: Verifica ownership esplicita
                    if (item.getTimesheetDay() != null && !item.getTimesheetDay().getId().equals(day.getId())) {
                        throw new TimesheetValidationException(
                                "SECURITY VIOLATION: Item " + itemId
                                + " non appartiene al day " + day.getId());
                    }
                    log.debug("[{}] Ownership validation OK per item {}", opName, itemId);
                } else {
                    // Crea nuovo item con ownership immediata
                    item = new TimesheetItem();
                    item.setTimesheetDay(day);
                }

                // Invalida cache
                cacheManager.invalidateDay(employeeId, date);
                // Esegue l'operazione
                TimesheetItem resultItem = operation.apply(day, item);
                // Assicura che l'item sia nel day
                if (!day.getItems().contains(resultItem)) {
                    day.addItem(resultItem);
                }
                // Salva
                TimesheetDay savedDay = timesheetDayRepository.save(day);
                log.debug("[{}] Item operation salvata: itemId={}", opName, resultItem.getId());
                // Ripopola cache
                cacheManager.safePopulateCache(employeeId, date, savedDay);
                // Invalida range asincrono
                CompletableFuture.runAsync(() -> {
                    try {
                        cacheManager.invalidateRangeCachesContaining(employeeId, date);
                    } catch (Exception e) {
                        log.warn("[{}] Fallita invalidazione range: {}", opName, e.getMessage());
                    }
                });
                return TimesheetDayProjection.fromEntity(savedDay);
            });
        });
    }

    @FunctionalInterface
    protected interface ReportQueryExecutor<T> {

        Page<T> execute(LocalDate start, LocalDate end, Pageable pageable);
    }

    // =============================================================
    // Template Method per eseguire in modo uniforme le query report 
    // =============================================================
    protected <T, R> Page<R> executeReportQuery(
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable,
            ReportQueryExecutor<T> executor,
            Function<T, R> transformer,
            String operationName
    ) {
        return executeSafely(operationName, () -> {
            // Parsing sicuro del range date
            LocalDate[] safeDate = validator.parseDateRange(startDate, endDate);
            LocalDate safeStart = safeDate[0];
            LocalDate safeEnd = safeDate[1];
            // Esecuzione query report
            Page<T> rawPage = executor.execute(safeStart, safeEnd, pageable);
            List<R> content = rawPage.getContent().stream().map(transformer).toList();
            return new PageImpl<>(content, pageable, rawPage.getTotalElements());
        });
    }
}
