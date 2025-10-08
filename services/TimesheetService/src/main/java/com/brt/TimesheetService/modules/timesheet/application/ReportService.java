package com.brt.TimesheetService.modules.timesheet.application;

import java.time.LocalDate;
import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.brt.TimesheetService.modules.timesheet.application.validator.TimesheetValidator;
import com.brt.TimesheetService.modules.timesheet.infrastructure.TimesheetItemRepository;
import com.brt.TimesheetService.shared.dto.CommessaHoursDTO;
import com.brt.TimesheetService.shared.projection.DailyHoursReportProjection;
import com.brt.TimesheetService.shared.projection.EmployeeCommessaHoursProjection;
import com.brt.TimesheetService.shared.projection.EmployeeTotalHoursProjection;

@Service
public class ReportService extends BaseTimesheetService {

    private final TimesheetItemRepository timesheetItemRepository;

    public ReportService(
            TimesheetValidator validator,
            TimesheetItemRepository timesheetItemRepository
    ) {
        super(null, validator, null, null);
        this.timesheetItemRepository = timesheetItemRepository;
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
                    List<String> employeeNames = timesheetItemRepository.findDistinctEmployeeNamesByCommessaAndDate(proj.commessaId(), startDate, endDate);
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
     * Report giornaliero per tutte le commesse
     */
    public Page<DailyHoursReportProjection> getReportForAllCommessa(
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        return executeReportQuery(
                startDate,
                endDate,
                pageable,
                (s, e, p) -> timesheetItemRepository.aggregateDailyHoursAllCommesseByDate(s, e, p),
                Function.identity(),
                "getReportForAllCommessa"
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
