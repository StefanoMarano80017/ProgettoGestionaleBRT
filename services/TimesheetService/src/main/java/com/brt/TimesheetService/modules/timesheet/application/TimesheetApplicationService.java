package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.exception.TimesheetValidationException;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.projection.TimesheetDayProjection;
import com.brt.TimesheetService.projection.TimesheetItemProjection;
import com.brt.TimesheetService.repository.EmployeeRepository;
import com.brt.TimesheetService.repository.TimesheetDayRepository;
import com.brt.TimesheetService.service.Validator.OperationContext;
import com.brt.TimesheetService.service.Validator.TimesheetValidator;
import com.brt.TimesheetService.service.caching.TimesheetCacheManager;

@Service
@Transactional
public class TimesheetApplicationService {

    private static final Logger log = LoggerFactory.getLogger(TimesheetApplicationService.class);

    private final TimesheetDayRepository timesheetDayRepository;
    private final EmployeeRepository employeeRepository;
    private final TimesheetDomainService domainService;
    private final TimesheetValidator validator;
    private final TimesheetCacheManager cacheManager;

    public TimesheetApplicationService(
            TimesheetDayRepository timesheetDayRepository,
            EmployeeRepository employeeRepository,
            TimesheetDomainService domainService,
            TimesheetValidator validator
    ) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.employeeRepository = employeeRepository;
        this.domainService = domainService;
        this.validator = validator;
        this.cacheManager = new TimesheetCacheManager();
    }

    // ============================================================
    // METODI UTILITY
    // ============================================================
    private Employee getEmployeeOrThrow(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato (ID: " + employeeId + ")"));
    }

    private TimesheetDay getTimesheetDayOrThrow(Employee employee, LocalDate date) {
        return timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet non trovato per " + employee.getId() + " il giorno " + date));
    }

    private boolean isTimesheetDayExists(Employee employee, LocalDate date) {
        return timesheetDayRepository.existsByEmployeeAndDate(employee, date);
    }

    // ============================================================
    // METODI TEMPLATE GENERICI
    // ============================================================
    private <R> R executeSafely(String opName, Supplier<R> operation) {
        log.info("[{}] Avvio operazione", opName);
        long start = System.currentTimeMillis();
        try {
            R result = operation.get();
            log.info("[{}] Completato in {} ms", opName, System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("[{}] Errore: {}", opName, e.getMessage(), e);
            throw new TimesheetValidationException("Errore in " + opName, e);
        }
    }

    // ---------------- Lettura con cache ----------------
    private TimesheetDayProjection executeOnTimesheetReadOnly(
            Long employeeId,
            LocalDate date,
            OperationContext context,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            // Recupera entity dalla cache o repository
            Optional<TimesheetDay> optDay = cacheManager.getDay(employeeId, date);
            TimesheetDay day;
            if (optDay.isPresent()) {
                day = optDay.get();
            } else {
                day = getTimesheetDayOrThrow(employee, date);
                // Metti in cache dopo aver recuperato dal DB
                cacheManager.putDay(employeeId, date, day);
            }
            // Valida SEMPRE, anche se viene dalla cache
            validator.validateRules(day, context, employee);
            return TimesheetDayProjection.fromEntity(day);
        });
    }

    // ---------------- Scrittura/aggiornamento con cache ----------------
    private <R> R executeOnTimesheet(
            Long employeeId,
            LocalDate date,
            OperationContext context,
            BiFunction<TimesheetDay, Employee, R> operation,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);

            // Invalida PRIMA della modifica per evitare race conditions
            cacheManager.invalidateDay(employeeId, date);

            // Recupera dal repository (non dalla cache, l'abbiamo invalidata)
            TimesheetDay day = getTimesheetDayOrThrow(employee, date);

            // Valida i permessi di accesso e condizioni
            validator.validateRules(day, context, employee);

            // Esegue l'operazione (che può modificare il day e restituire un risultato)
            R result = operation.apply(day, employee);

            // Salva nel DB
            TimesheetDay savedDay = timesheetDayRepository.save(day);

            // Aggiorna la cache DOPO il salvataggio
            cacheManager.putDay(employeeId, date, savedDay);

            return result;
        });
    }

    private <R> R executeOnNewTimesheet(
            Long employeeId,
            LocalDate date,
            OperationContext context,
            BiFunction<TimesheetDay, Employee, R> operation,
            String opName
    ) {
        return executeSafely(opName, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);

            if (isTimesheetDayExists(employee, date)) {
                throw new IllegalStateException("Il timesheet esiste già per il giorno " + date);
            }

            TimesheetDay day = TimesheetDay.builder().employee(employee).date(date).build();
            validator.validateRules(day, context, employee);

            // Esegue l'operazione
            R result = operation.apply(day, employee);

            TimesheetDay savedDay = timesheetDayRepository.save(day);

            // Invalida i range DOPO aver salvato
            cacheManager.putDay(employeeId, date, savedDay);
            cacheManager.invalidateRangeCachesContaining(employeeId, date);

            return result;
        });
    }

    // ---------------- Pagine / range ----------------
    private <R> Page<R> executeOnTimesheetPaged(
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
                    .getRange(employeeId, startDate, endDate, pageable.getPageNumber(), pageable.getPageSize())
                    .map(page -> page.map(mapper)) // se presente in cache, mappa direttamente
                    .orElseGet(() -> {
                        // altrimenti recupera dal repository
                        Page<TimesheetDay> newPage = queryFn.apply(employee, pageable);
                        // salva nella cache e aggiorna indice
                        cacheManager.putRange(employeeId, startDate, endDate, pageable.getPageNumber(), pageable.getPageSize(), newPage);
                        return newPage.map(mapper);
                    });
        });
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
        return saveTimesheet(employeeId, date, dto, OperationContext.USER, "saveTimesheetUser");
    }

    public TimesheetDayProjection saveTimesheetAdmin(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return saveTimesheet(employeeId, date, dto, OperationContext.ADMIN, "saveTimesheetAdmin");
    }

    private TimesheetDayProjection saveTimesheet(
            Long employeeId,
            LocalDate date,
            TimesheetDayDTO dto,
            OperationContext context,
            String opNamePrefix
    ) {
        return executeSafely(opNamePrefix, () -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            if (isTimesheetDayExists(employee, date)) {
                return executeOnTimesheet(
                        employeeId,
                        date,
                        context,
                        (day, emp) -> TimesheetDayProjection.fromEntity(domainService.updateTimesheet(day, dto)),
                        opNamePrefix + "[update]"
                );
            } else {
                return executeOnNewTimesheet(
                        employeeId,
                        date,
                        context,
                        (day, emp) -> TimesheetDayProjection.fromEntity(domainService.createTimesheet(day, dto)),
                        opNamePrefix + "[create]"
                );
            }
        });
    }

    public void deleteTimesheetUser(Long employeeId, LocalDate date) {
        executeOnTimesheet(
                employeeId,
                date,
                OperationContext.USER,
                (day, emp) -> {
                    timesheetDayRepository.delete(day);
                    cacheManager.invalidateDay(employeeId, date);
                    return null;
                },
                "deleteTimesheetUser"
        );
    }

    public void deleteTimesheetAdmin(Long employeeId, LocalDate date) {
        executeOnTimesheet(
                employeeId,
                date,
                OperationContext.ADMIN,
                (day, emp) -> {
                    timesheetDayRepository.delete(day);
                    cacheManager.invalidateDay(employeeId, date);
                    return null;
                },
                "deleteTimesheetAdmin"
        );
    }

    // ============================================================
    // METODI item
    // ============================================================
    public TimesheetItemProjection addOrCreateItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheet(
                employeeId,
                date,
                OperationContext.USER,
                (day, emp) -> TimesheetItemProjection.fromEntity(domainService.addItem(day, dto)),
                "addOrCreateItem"
        );
    }

    public TimesheetItemProjection putItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheet(
                employeeId,
                date,
                OperationContext.USER,
                (day, emp) -> TimesheetItemProjection.fromEntity(domainService.putItem(day, dto)),
                "putItem"
        );
    }

    public void deleteItem(Long employeeId, LocalDate date, Long itemId) {
        executeOnTimesheet(
                employeeId,
                date,
                OperationContext.USER,
                (day, emp) -> {
                    domainService.deleteItem(day, itemId);
                    return null;
                },
                "deleteItem"
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
                (day, emp) -> TimesheetDayProjection.fromEntity(domainService.setAbsence(day, dto.getAbsenceTypeEnum())),
                "setAbsence"
        );
    }

    @Transactional
    public List<TimesheetDayProjection> setAbsences(Long employeeId, LocalDate startDate, LocalDate endDate, AbsenceType absenceType) {
        return executeSafely("setAbsences", () -> {
            Employee employee = getEmployeeOrThrow(employeeId);

            if (startDate == null || endDate == null) {
                throw new TimesheetValidationException("startDate o endDate non possono essere null");
            }
            if (startDate.isAfter(endDate)) {
                throw new TimesheetValidationException("startDate deve precedere endDate");
            }

            // Invalida tutti i giorni del range PRIMA delle modifiche
            LocalDate current = startDate;
            while (!current.isAfter(endDate)) {
                cacheManager.invalidateDay(employeeId, current);
                current = current.plusDays(1);
            }

            // Esegue la modifica batch
            List<TimesheetDay> days = domainService.setAbsences(employee, startDate, endDate, absenceType);

            // Salva tutti i giorni
            List<TimesheetDay> savedDays = timesheetDayRepository.saveAll(days);

            // Aggiorna la cache per tutti i giorni salvati
            for (TimesheetDay day : savedDays) {
                cacheManager.putDay(employeeId, day.getDate(), day);
            }

            // Invalida le cache range che intersecano questo periodo
            cacheManager.invalidateRangeCachesContaining(employeeId, startDate);
            cacheManager.invalidateRangeCachesContaining(employeeId, endDate);

            return savedDays.stream().map(TimesheetDayProjection::fromEntity).toList();
        });
    }
}
