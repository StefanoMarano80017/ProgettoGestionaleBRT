package com.brt.TimesheetService.service;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.brt.TimesheetService.dto.CommessaHoursDTO;
import com.brt.TimesheetService.dto.DailyHoursReportDTO;
import com.brt.TimesheetService.dto.EmployeeTotalHoursDTO;
import com.brt.TimesheetService.dto.ReportDTOs.EmployeeCommessaHoursDTO;
import com.brt.TimesheetService.repository.TimesheetItemRepository;

@Service
public class ReportService {
    private final TimesheetItemRepository timesheetItemRepository;

    public ReportService(TimesheetItemRepository timesheetItemRepository) {
        this.timesheetItemRepository = timesheetItemRepository;
    }

    // Ore totali per commessa
    public Page<CommessaHoursDTO> getTotalHoursByCommessa(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<CommessaHoursDTO> commessaPage = timesheetItemRepository.aggregateHoursByCommessa(startDate, endDate, pageable);

        // For each commessa, fetch distinct employee names for that commessa and period
        List<CommessaHoursDTO> enrichedList = commessaPage.getContent().stream().map(commessaDTO -> {
            List<String> employeeNames = timesheetItemRepository.findDistinctEmployeeNamesByCommessaAndDate(
                commessaDTO.getCommessaId(), startDate, endDate
            );
            return new CommessaHoursDTO(
                commessaDTO.getCommessaId(),
                commessaDTO.getCommessaCode(),
                commessaDTO.getTotalHours(),
                employeeNames
            );
        }).toList();

        return new org.springframework.data.domain.PageImpl<>(enrichedList, pageable, commessaPage.getTotalElements());
    }

    // Ore totali per dipendente
    public Page<EmployeeTotalHoursDTO> getTotalHoursByEmployee(Pageable pageable) {
        return timesheetItemRepository.aggregateHoursByEmployee(pageable);
    }


    public Page<DailyHoursReportDTO> getReportGroupedByCommessaOptimized(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return timesheetItemRepository.aggregateDailyHoursAllCommesseByDate(startDate, endDate, pageable);
    }

    public Page<DailyHoursReportDTO> getReportForSingleCommessa(String commessaCode, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return timesheetItemRepository.aggregateDailyHoursByCommessaAndDate(commessaCode, startDate, endDate, pageable);
    }

    
    public Page<EmployeeCommessaHoursDTO> getEmployeeHoursForCommessa(Long employeeId, String commessaCode, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return timesheetItemRepository.getHoursByEmployeeAndCommessa(employeeId, commessaCode, startDate, endDate, pageable);
    }

    public Page<EmployeeCommessaHoursDTO> getEmployeeHoursAllCommesse(Long employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return timesheetItemRepository.getHoursByEmployeeAllCommesse(employeeId, startDate, endDate, pageable);
    }

    /**
     * Restituisce il totale ore per ogni commessa a cui ha partecipato un dipendente in un periodo.
     */
    public Page<EmployeeTotalHoursDTO> getTotalHoursByCommessaForEmployee(Long employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return timesheetItemRepository.getTotalHoursByCommessaForEmployee(employeeId, startDate, endDate, pageable);
    }
}
