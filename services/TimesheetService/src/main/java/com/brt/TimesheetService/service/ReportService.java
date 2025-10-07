package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.util.List;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.brt.TimesheetService.dto.CommessaHoursDTO;
import com.brt.TimesheetService.exception.ReportProcessingException;
import com.brt.TimesheetService.projection.DailyHoursReportProjection;
import com.brt.TimesheetService.projection.EmployeeCommessaHoursProjection;
import com.brt.TimesheetService.projection.EmployeeTotalHoursProjection;
import com.brt.TimesheetService.repository.TimesheetItemRepository;
import com.brt.TimesheetService.service.Validator.TimesheetValidator;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final TimesheetItemRepository timesheetItemRepository;
    private final TimesheetValidator timesheetValidator;

    public ReportService(TimesheetItemRepository timesheetItemRepository, TimesheetValidator timesheetValidator) {
        this.timesheetItemRepository = timesheetItemRepository;
        this.timesheetValidator = timesheetValidator;
    }

    // =============================================================
    // Template Method per eseguire in modo uniforme le query report
    // =============================================================
    private <T, R> Page<R> executeReportQuery(
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable,
            ReportQueryExecutor<T> executor,
            Function<T, R> transformer,
            String operationName
    ) {
        LocalDate[] safeDate = timesheetValidator.parseDateRange(startDate, endDate);
        LocalDate safeStart = safeDate[0];
        LocalDate safeEnd = safeDate[1];

        log.info("[{}] Avvio report dal {} al {}, page={}, size={}", operationName, safeStart, safeEnd, pageable.getPageNumber(), pageable.getPageSize());
        try {
            long startTime = System.currentTimeMillis();
            Page<T> rawPage = executor.execute(safeStart, safeEnd, pageable);
            List<R> content = rawPage.getContent().stream().map(transformer).toList();
            Page<R> result = new PageImpl<>(content, pageable, rawPage.getTotalElements());
            long duration = System.currentTimeMillis() - startTime;
            log.info("[{}] Completato in {} ms ({} risultati)", operationName, duration, result.getTotalElements());
            return result;
        } catch (IllegalArgumentException ex) {
            log.warn("[{}] Errore di validazione: {}", operationName, ex.getMessage());
            throw ex; // lascia gestire al controller advice
        } catch (Exception ex) {
            log.error("[{}] Errore imprevisto durante il report: {}", operationName, ex.getMessage(), ex);
            throw new ReportProcessingException("Errore durante l'elaborazione del report " + operationName, ex);
        }
    }

    @FunctionalInterface
    private interface ReportQueryExecutor<T> {

        Page<T> execute(LocalDate start, LocalDate end, Pageable pageable);
    }

    // =============================================================
    // METODI PUBBLICI DI BUSINESS
    // =============================================================
    /**
     * Ore totali per commessa con lista di dipendenti
     */
    public Page<CommessaHoursDTO> getTotalHoursByCommessa(
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.aggregateHoursByCommessa(s, e, p),
                proj -> {
                    List<String> employeeNames = timesheetItemRepository.findDistinctEmployeeNamesByCommessaAndDate(
                            proj.commessaId(), startDate, endDate
                    );
                    return new CommessaHoursDTO(
                            proj.commessaId(),
                            proj.commessaCode(),
                            proj.totalHours(),
                            employeeNames
                    );
                },
                "getTotalHoursByCommessa"
        );
    }

    /**
     * Ore totali per ogni dipendente in una commessa specifica
     */
    public Page<EmployeeCommessaHoursProjection> getTotalHoursPerEmployeeForCommessa(
            String commessaCode,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.getTotalHoursPerEmployeeForCommessa(commessaCode, s, e, p),
                Function.identity(),
                "getTotalHoursPerEmployeeForCommessa[" + commessaCode + "]"
        );
    }

    /**
     * Ore totali per dipendente su tutte le commesse
     */
    public Page<EmployeeTotalHoursProjection> getTotalHoursByEmployee(
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.aggregateHoursByEmployee(s, e, p),
                Function.identity(),
                "getTotalHoursByEmployee"
        );
    }

    /**
     * Report giornaliero per tutte le commesse
     */
    public Page<DailyHoursReportProjection> getReportGroupedByCommessaOptimized(
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.aggregateDailyHoursAllCommesse(s, e, p),
                Function.identity(),
                "getReportGroupedByCommessaOptimized"
        );
    }

    /**
     * Report giornaliero per una singola commessa
     */
    public Page<DailyHoursReportProjection> getReportForSingleCommessa(
            String commessaCode,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.aggregateDailyHoursByCommessaAndDate(commessaCode, s, e, p),
                Function.identity(),
                "getReportForSingleCommessa[" + commessaCode + "]"
        );
    }

    /**
     * Ore per un dipendente su una specifica commessa
     */
    public Page<EmployeeCommessaHoursProjection> getEmployeeHoursForCommessa(
            Long employeeId,
            String commessaCode,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.getHoursByEmployeeAndCommessa(employeeId, commessaCode, s, e, p),
                Function.identity(),
                "getEmployeeHoursForCommessa[emp=" + employeeId + ", comm=" + commessaCode + "]"
        );
    }

    /**
     * Ore per un dipendente su tutte le commesse
     */
    public Page<EmployeeCommessaHoursProjection> getEmployeeHoursAllCommesse(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.getHoursByEmployeeAllCommesse(employeeId, s, e, p),
                Function.identity(),
                "getEmployeeHoursAllCommesse[emp=" + employeeId + "]"
        );
    }
}
