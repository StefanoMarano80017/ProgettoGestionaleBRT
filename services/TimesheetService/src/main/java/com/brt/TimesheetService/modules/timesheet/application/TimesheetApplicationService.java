package com.brt.TimesheetService.modules.timesheet.application;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.modules.timesheet.application.caching.TimesheetCacheManager;
import com.brt.TimesheetService.modules.timesheet.application.validator.OperationContext;
import com.brt.TimesheetService.modules.timesheet.application.validator.TimesheetValidator;
import com.brt.TimesheetService.modules.timesheet.domain.AbsenceType;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetDay;
import com.brt.TimesheetService.modules.timesheet.domain.service.TimesheetDomainService;
import com.brt.TimesheetService.modules.timesheet.infrastructure.TimesheetDayRepository;
import com.brt.TimesheetService.modules.user.domain.Employee;
import com.brt.TimesheetService.modules.user.infrastructure.EmployeeRepository;
import com.brt.TimesheetService.shared.dto.TimesheetDayDTO;
import com.brt.TimesheetService.shared.dto.TimesheetItemDTO;
import com.brt.TimesheetService.shared.exception.TimesheetValidationException;
import com.brt.TimesheetService.shared.projection.TimesheetDayProjection;

/**
 * Application Service per la gestione dei timesheet.
 *
 * ARCHITETTURA CACHE E CONCORRENZA: - Usa double-checked locking per prevenire
 * cache stampede - Lock granulari per operazione (employeeId + date) - Pattern:
 * Lock -> Read fresh -> Validate -> Invalidate -> Modify -> Save -> Cache -
 * Gestione errori cache con fallback e retry asincroni
 *
 * INVARIANTI GARANTITE: 1. Nessuna scrittura cache prima della validazione 2.
 * Tutte le modifiche DB sono protette da lock 3. Cache invalidation avviene
 * DENTRO il lock critico 4. Fresh reads dal DB per operazioni di scrittura
 *
 * @author Stefano Marano
 * @version 2.0 - Refactored con gestione concorrenza robusta
 */
@Service
@Transactional
public class TimesheetApplicationService extends BaseTimesheetService {

    private static final Logger log = LoggerFactory.getLogger(TimesheetApplicationService.class);

    private final TimesheetDomainService domainService;

    public TimesheetApplicationService(
            TimesheetDayRepository timesheetDayRepository,
            EmployeeRepository employeeRepository,
            TimesheetDomainService domainService,
            TimesheetValidator validator,
            TimesheetCacheManager cacheManager
    ) {
        super(timesheetDayRepository, validator, cacheManager, employeeRepository);
        this.domainService = domainService;
    }

    // ============================================================
    // METODI PUBBLICI
    // ============================================================
    public TimesheetDayProjection getTimesheet(Long employeeId, LocalDate date) {
        return executeOnTimesheetReadOnly(
                employeeId,
                date,
                OperationContext.ADMIN,
                "getTimesheet[admin]"
        );
    }

    public TimesheetDayProjection getTimesheetEmployee(Long employeeId, LocalDate date) {
        return executeOnTimesheetReadOnly(
                employeeId,
                date,
                OperationContext.USER,
                "getTimesheet[user]"
        );
    }

    public Page<TimesheetDayProjection> getTimesheets(Long employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        LocalDate[] range = validator.parseDateRange(startDate, endDate);
        return executeOnTimesheetPaged(
                employeeId,
                pageable,
                TimesheetDayProjection::fromEntity,
                (emp, pg) -> timesheetDayRepository.findByEmployeeAndDateBetween(emp, range[0], range[1], pg),
                range[0],
                range[1],
                "getTimesheets[range]"
        );
    }

    public TimesheetDayProjection saveTimesheetUser(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return saveTimesheet(employeeId, date, dto, OperationContext.USER);
    }

    public TimesheetDayProjection saveTimesheetAdmin(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return saveTimesheet(employeeId, date, dto, OperationContext.ADMIN);
    }

    /**
     * Salva un timesheet (crea se non esiste, aggiorna se esiste). La decisione
     * create/update avviene dentro un lock per evitare race.
     */
    private TimesheetDayProjection saveTimesheet(
            Long employeeId,
            LocalDate date,
            TimesheetDayDTO dto,
            OperationContext context
    ) {
        Employee employee = getEmployeeOrThrow(employeeId);
        String lockKey = employeeId + "_" + date;
        return withLock(lockKey, () -> {
            // Check existence dentro il lock
            boolean exists = isTimesheetDayExists(employee, date);
            if (exists) {
                log.trace("Timesheet esistente -> update");
                return executeOnTimesheet(
                        employeeId,
                        date,
                        context,
                        (day, emp) -> domainService.updateTimesheet(day, dto),
                        "saveTimesheet" + "[update]"
                );
            } else {
                log.trace("Timesheet non esistente -> create");
                return executeOnNewTimesheet(
                        employeeId,
                        date,
                        context,
                        (day, emp) -> domainService.createTimesheet(day, dto),
                        "saveTimesheet" + "[create]"
                );
            }
        });
    }

    public void deleteTimesheetUser(Long employeeId, LocalDate date) {
        deleteTimesheet(employeeId, date, OperationContext.USER);
    }

    public void deleteTimesheetAdmin(Long employeeId, LocalDate date) {
        deleteTimesheet(employeeId, date, OperationContext.ADMIN);
    }

    private void deleteTimesheet(long employeeId, LocalDate date, OperationContext context) {
        String lockKey = employeeId + "_" + date;
        withLock(lockKey, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            // CRITICAL: Fresh read dal DB DENTRO il lock
            TimesheetDay day = getTimesheetDayOrThrow(employee, date);
            // Validazione con stato fresco
            validator.validateRules(day, context, employee);
            // Invalida cache PRIMA della modifica 
            cacheManager.invalidateDay(employeeId, date);
            log.trace("[{}] Cache invalidata per employeeId={}, date={}", "deleteTimesheetUser", employeeId, date);
            // Esegue la modifica
            timesheetDayRepository.delete(day);
            // Invalida range cache FUORI dal critica path per performance
            CompletableFuture.runAsync(() -> {
                try {
                    cacheManager.invalidateRangeCachesContaining(employeeId, date);
                    log.trace("[{}] Range cache invalidate per date={}", "deleteTimesheetUser", date);
                } catch (Exception e) {
                    log.warn("[{}] Fallita invalidazione range cache: {}",
                            "deleteTimesheetUser", e.getMessage());
                }
            });
        });
    }

    // ============================================================
    // METODI item
    // ============================================================
    public TimesheetDayProjection addOrCreateItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheetItem(
                employeeId,
                date,
                dto.getId() != null ? dto.getId() : null,
                OperationContext.USER,
                (day, item) -> domainService.addItem(day, dto), // aggiorna day con il nuovo item
                "addItem"
        );
    }

    public TimesheetDayProjection putItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheetItem(
                employeeId,
                date,
                getTimesheetItemIdOrThrow(dto),
                OperationContext.USER,
                (day, item) -> domainService.putItem(day, dto),
                "updateItem"
        );
    }

    public void deleteItem(Long employeeId, LocalDate date, Long itemId) {
        executeOnTimesheetItem(
                employeeId,
                date,
                itemId,
                OperationContext.USER,
                (day, item) -> {
                    domainService.deleteItem(day, itemId);
                    return null;
                },
                "updateItem"
        );
    }

    // ============================================================
    // METODI ASSENZE
    // ============================================================
    public TimesheetDayProjection setAbsence(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return executeOnNewTimesheet(
                employeeId,
                date,
                OperationContext.ADMIN_SET_ABSENCE,
                (day, emp) -> domainService.setAbsence(day, dto.getAbsenceTypeEnum()),
                "setAbsence"
        );
    }

    /**
     * Imposta assenze per un range di date in modo atomico e con cache
     * consistency. Usa un approccio pessimistico: lock -> invalidate all ->
     * modify -> save all -> cache all.
     */
    @Transactional
    public List<TimesheetDayProjection> setAbsences(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            AbsenceType absenceType
    ) {
        return executeSafely("setAbsences", () -> {
            // Validazione input
            if (startDate == null || endDate == null) {
                throw new TimesheetValidationException("startDate o endDate non possono essere null");
            }
            if (startDate.isAfter(endDate)) {
                throw new TimesheetValidationException("startDate deve precedere endDate");
            }

            Employee employee = getEmployeeOrThrow(employeeId);

            // CRITICAL: Acquisisce un lock globale per tutto il range
            String lockKey = employeeId + "_range_" + startDate + "_" + endDate;
            return withLock(lockKey, () -> {
                log.debug("Lock acquisito per batch absence: employeeId={}, range={} to {}",
                        employeeId, startDate, endDate);

                // Step 1: Invalida proattivamente tutto il range
                List<LocalDate> affectedDates = new ArrayList<>();
                LocalDate current = startDate;
                while (!current.isAfter(endDate)) {
                    cacheManager.invalidateDay(employeeId, current);
                    affectedDates.add(current);
                    current = current.plusDays(1);
                }
                log.debug("Invalidate {} cache entries per batch", affectedDates.size());

                // Step 2: Esegue la modifica batch (può creare nuovi record)
                List<TimesheetDay> days = domainService.setAbsences(employee, startDate, endDate, absenceType);

                // Step 3: Salva tutti i giorni in una singola transazione
                List<TimesheetDay> savedDays = timesheetDayRepository.saveAll(days);
                log.info("Salvati {} giorni di assenza per employeeId={}", savedDays.size(), employeeId);

                // Step 4: Ripopola la cache per tutti i giorni salvati
                int cacheErrors = 0;
                for (TimesheetDay day : savedDays) {
                    try {
                        cacheManager.putDay(employeeId, day.getDate(), day);
                    } catch (Exception e) {
                        cacheErrors++;
                        log.error("Errore caching day dopo batch save: employeeId={}, date={}: {}", employeeId, day.getDate(), e.getMessage());
                    }
                }

                if (cacheErrors > 0) {
                    log.warn("Batch save completato ma {} giorni non sono stati cachati", cacheErrors);
                }

                // Step 5: Invalida range cache che intersecano questo periodo
                try {
                    cacheManager.invalidateRangeCachesContaining(employeeId, startDate);
                    cacheManager.invalidateRangeCachesContaining(employeeId, endDate);

                    // Invalida anche eventuali range intermedi per essere sicuri
                    if (startDate.plusMonths(1).isBefore(endDate)) {
                        LocalDate midPoint = startDate.plusDays(
                                startDate.until(endDate).getDays() / 2
                        );
                        cacheManager.invalidateRangeCachesContaining(employeeId, midPoint);
                    }
                } catch (Exception e) {
                    log.warn("Errore durante invalidazione range cache post-batch: {}", e.getMessage());
                }

                return savedDays.stream().map(TimesheetDayProjection::fromEntity).toList();
            });
        });
    }
}
