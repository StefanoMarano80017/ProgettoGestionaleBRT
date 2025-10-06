package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.projection.TimesheetDayProjection;
import com.brt.TimesheetService.projection.TimesheetItemProjection;
import com.brt.TimesheetService.repository.EmployeeRepository;
import com.brt.TimesheetService.repository.TimesheetDayRepository;
import com.brt.TimesheetService.service.Validator.OperationContext;
import com.brt.TimesheetService.service.Validator.TimesheetValidator;

@Service
@Transactional
public class TimesheetApplicationService {

    private static final Logger log = LoggerFactory.getLogger(TimesheetApplicationService.class);

    private final TimesheetDayRepository timesheetDayRepository;
    private final EmployeeRepository employeeRepository;
    private final TimesheetDomainService domainService;
    private final TimesheetValidator validator;

    public TimesheetApplicationService(TimesheetDayRepository timesheetDayRepository,
                                       EmployeeRepository employeeRepository,
                                       TimesheetDomainService domainService,
                                       TimesheetValidator validator) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.employeeRepository = employeeRepository;
        this.domainService = domainService;
        this.validator = validator;
    }

    // ============================================================
    // TEMPLATE METHOD BASE CON LOGGING E GESTIONE ERRORI
    // ============================================================
    private <R> R executeSafely(String operationName, Function<Void, R> operation) {
        log.info("[{}] Avvio operazione timesheet", operationName);
        long start = System.currentTimeMillis();
        try {
            R result = operation.apply(null);
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] Completato con successo in {} ms", operationName, duration);
            return result;
        } catch (ResourceNotFoundException e) {
            log.warn("[{}] Risorsa non trovata: {}", operationName, e.getMessage());
            throw e;
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("[{}] Errore di validazione: {}", operationName, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[{}] Errore imprevisto: {}", operationName, e.getMessage(), e);
            throw new TimesheetOperationException("Errore durante l’operazione " + operationName, e);
        }
    }

    // ============================================================
    // UTILITY DI BASE
    // ============================================================
    private Employee getEmployeeOrThrow(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato (ID: " + employeeId + ")"));
    }

    private TimesheetDay getTimesheetDayOrThrow(Employee employee, LocalDate date) {
        return timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Timesheet non trovato per " + employee.getId() + " il giorno " + date));
    }

    private boolean isTimesheetDayExists(Employee employee, LocalDate date) {
        return timesheetDayRepository.existsByEmployeeAndDate(employee, date);
    }

    // ============================================================
    // TEMPLATE METHODS PER AZIONI SPECIFICHE
    // ============================================================
    private <R> R executeOnTimesheet(
        Long employeeId, 
        LocalDate date,
        OperationContext context,
        Function<TimesheetDay, R> action,
        String opName
    ) {
        return executeSafely(opName, ignored -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            TimesheetDay day = getTimesheetDayOrThrow(employee, date);
            validator.validateRules(day, context, employee);
            action.apply(day);  
            TimesheetDay saved = timesheetDayRepository.save(day);    // salva e aggiorna 
            return (R) TimesheetDayProjection.fromEntity(saved);      // restituisce l'oggetto finale
        });
    }

    private <R> R executeOnNewTimesheet(
        Long employeeId, 
        LocalDate date,
        OperationContext context,
        Function<TimesheetDay, R> action,
        String opName
    ) {
        return executeSafely(opName, ignored -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            if (isTimesheetDayExists(employee, date)) {
                throw new IllegalStateException("Il timesheet esiste già per il giorno " + date);
            }
            TimesheetDay day = TimesheetDay.builder().employee(employee).date(date).build();
            validator.validateRules(day, context, employee);
            R result = action.apply(day);      // <-- ora R può essere TimesheetDayProjection
            timesheetDayRepository.save(day);   // salva sempre il day nel DB
            return result;
        });
    }

    private <R> Page<R> executeOnTimesheetPaged(
        Long employeeId,
        Pageable pageable,
        Function<TimesheetDay, R> mapper,
        BiFunction<Employee, Pageable, Page<TimesheetDay>> queryFn,
        String opName
    ) {
        return executeSafely(opName, ignored -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            Page<TimesheetDay> page = queryFn.apply(employee, pageable);
            return page.map(mapper);
        });
    }

    // ============================================================
    // ACTION METHODS (USERS / ADMIN)
    // ============================================================
    public TimesheetDayProjection getTimesheet(Long employeeId, LocalDate date) {
        return executeOnTimesheet(employeeId, date, OperationContext.ADMIN, TimesheetDayProjection::fromEntity, "getTimesheet[admin]");
    }

    public TimesheetDayProjection getTimesheetEmployee(Long employeeId, LocalDate date) {
        return executeOnTimesheet(employeeId, date, OperationContext.USER, TimesheetDayProjection::fromEntity, "getTimesheet[user]");
    }

    public Page<TimesheetDayProjection> getTimesheets(
        Long employeeId,
        LocalDate startDate,
        LocalDate endDate,
        Pageable pageable
    ) {
        LocalDate[] dateRange = validator.parseDateRange(startDate, endDate);
        return executeOnTimesheetPaged(employeeId, pageable, TimesheetDayProjection::fromEntity,
                (employee, p) -> timesheetDayRepository.findByEmployeeAndDateBetween(employee, dateRange[0], dateRange[1], p),
                "getTimesheets[range]");
    }

    // ============================================================
    // CREATE / UPDATE / DELETE TIMESHEET
    // ============================================================
    public TimesheetDayProjection saveTimesheetUser(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        Employee employee = getEmployeeOrThrow(employeeId);
        if (isTimesheetDayExists(employee, date)) {
            return executeOnTimesheet(employeeId, date, OperationContext.USER, day -> {
                TimesheetDay updated = domainService.updateTimesheet(day, dto);
                return TimesheetDayProjection.fromEntity(updated);
            }, "saveTimesheetUser[update]");
        }
        return executeOnNewTimesheet(employeeId, date, OperationContext.USER, day -> {
            TimesheetDay created = domainService.createTimesheet(day, dto);
            return TimesheetDayProjection.fromEntity(created);
        }, "saveTimesheetUser[create]");
    }

    public TimesheetDayProjection saveTimesheetAdmin(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        Employee employee = getEmployeeOrThrow(employeeId);
        if (isTimesheetDayExists(employee, date)) {
            return executeOnTimesheet(employeeId, date, OperationContext.ADMIN, day -> {
                TimesheetDay updated = domainService.updateTimesheet(day, dto);
                return TimesheetDayProjection.fromEntity(updated);
            }, "saveTimesheetAdmin[update]");
        }
        return executeOnNewTimesheet(employeeId, date, OperationContext.ADMIN, day -> {
            TimesheetDay created = domainService.createTimesheet(day, dto);
            return TimesheetDayProjection.fromEntity(created);
        }, "saveTimesheetAdmin[create]");
    }

    public void deleteTimesheetUser(Long employeeId, LocalDate date) {
        executeOnTimesheet(employeeId, date, OperationContext.USER, day -> {
            timesheetDayRepository.delete(day);
            return null;
        }, "deleteTimesheetUser");
    }

    public void deleteTimesheetAdmin(Long employeeId, LocalDate date) {
        executeOnTimesheet(employeeId, date, OperationContext.ADMIN, day -> {
            timesheetDayRepository.delete(day);
            return null;
        }, "deleteTimesheetAdmin");
    }

    // ============================================================
    // ASSENZE
    // ============================================================
    public TimesheetDayProjection setAbsence(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return executeOnNewTimesheet(employeeId, date, OperationContext.ADMIN_SET_ABSENCE, day -> {
            TimesheetDay updated = domainService.setAbsence(day, dto.getAbsenceTypeEnum());
            return TimesheetDayProjection.fromEntity(updated);
        }, "setAbsence");
    }

    public List<TimesheetDayProjection> setAbsences(Long employeeId, LocalDate startDate, LocalDate endDate, AbsenceType absenceType) {
        return executeSafely("setAbsences", ignored -> {
            Employee employee = getEmployeeOrThrow(employeeId);
            if(startDate == null) throw new IllegalStateException("startDate è null"); 
            if(endDate == null) throw new IllegalStateException("endDate è null"); 
            if(endDate.isAfter(startDate)) throw new IllegalStateException("endDate avviene prima di startDate");
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                if (isTimesheetDayExists(employee, date)) {
                    throw new IllegalStateException("Il timesheet del " + date + " esiste già");
                }
            }
            List<TimesheetDay> days = domainService.setAbsences(employee, startDate, endDate, absenceType);
            return timesheetDayRepository.saveAll(days)
                    .stream()
                    .map(TimesheetDayProjection::fromEntity)
                    .toList();
        });
    }

    // ============================================================
    // ITEMS OPERATIONS
    // ============================================================
    public TimesheetItemProjection addOrCreateItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheet(employeeId, date, OperationContext.USER, day -> {
            TimesheetItem item = domainService.addItem(day, dto);
            return TimesheetItemProjection.fromEntity(item);
        }, "addOrCreateItem");
    }

    public TimesheetItemProjection putItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheet(employeeId, date, OperationContext.USER, day -> {
            TimesheetItem item = domainService.putItem(day, dto);
            return TimesheetItemProjection.fromEntity(item);
        }, "putItem");
    }

    public TimesheetItemProjection deleteItem(Long employeeId, LocalDate date, Long itemId) {
        return executeOnTimesheet(employeeId, date, OperationContext.USER, day -> {
            domainService.deleteItem(day, itemId);
            return null;
        }, "deleteItem");
    }

    // ============================================================
    // EXCEPTION CUSTOM
    // ============================================================
    public static class TimesheetOperationException extends RuntimeException {
        public TimesheetOperationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
