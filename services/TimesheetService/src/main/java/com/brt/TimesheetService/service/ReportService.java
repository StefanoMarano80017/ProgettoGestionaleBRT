package com.brt.TimesheetService.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.brt.TimesheetService.dto.DailyHoursReportDTO;
import com.brt.TimesheetService.dto.ReportHoursDTO;
import com.brt.TimesheetService.repository.TimesheetItemRepository;

@Service
public class ReportService {

    private final TimesheetItemRepository timesheetItemRepository;

    public ReportService(TimesheetItemRepository timesheetItemRepository) {
        this.timesheetItemRepository = timesheetItemRepository;
    }

    /**
     * Ore totali per tutte le commesse (aggregato globale)
     */
    public List<ReportHoursDTO> getTotalHoursByCommessa() {
        List<Object[]> results = timesheetItemRepository.aggregateHoursByCommessa();

        return results.stream()
                        .map(row -> ReportHoursDTO.forCommessa(
                                ((Number) row[0]).longValue(),        // commessaId
                                row[1] != null ? row[1].toString() : null, // commessaCode
                                row[2] != null ? row[2].toString() : null, // commessaName
                                ((BigDecimal) row[3])                 // totalHours
                        ))
                        .collect(Collectors.toList());
    }

    /**
     * Ore totali per dipendente (aggregato globale)
     */
    public List<ReportHoursDTO> getTotalHoursByEmployee() {
        List<Object[]> results = timesheetItemRepository.aggregateHoursByEmployee();

        return results.stream()
                .map(row -> ReportHoursDTO.forEmployee(
                        ((Number) row[0]).longValue(),      // employeeId
                        (String) row[1],                     // employeeName
                        ((BigDecimal) row[2])                // totalHours
                ))
                .collect(Collectors.toList());
    }

    /**
     * Ore totali per commesse di un progetto specifico
     */
    public List<ReportHoursDTO> getTotalHoursByProject(Long projectId) {
        List<Object[]> results = timesheetItemRepository.aggregateHoursByProject(projectId);

       return results.stream()
                        .map(row -> ReportHoursDTO.forCommessa(
                                ((Number) row[0]).longValue(),        // commessaId
                                row[1] != null ? row[1].toString() : null, // commessaCode
                                row[2] != null ? row[2].toString() : null, // commessaName
                                ((BigDecimal) row[3])                 // totalHours
                        ))
                        .collect(Collectors.toList());
    }

    /**
     *  per ogni commessa, la lista di ogni dipendente quante ora vi ha dedicato giorno per giorno
     */
    public List<DailyHoursReportDTO> getDailyHoursByCommessa(Long commessaId) {
        return timesheetItemRepository.aggregateDailyHoursByCommessa(commessaId)
                .stream()
                .map(row -> DailyHoursReportDTO.builder()
                        .date((LocalDate) row[0])
                        .employeeId(((Number) row[1]).longValue())
                        .employeeName((String) row[2])
                        .commessaId(((Number) row[3]).longValue())
                        .commessaCode((String) row[4])
                        .commessaName((String) row[5])
                        .hours((BigDecimal) row[6])
                        .build())
                .collect(Collectors.toList());
    }

    /**
     *  per ogni dipendente, la lista di ogni commessa quante ore vi ha dedicato giorno per giorno
     */
    public List<DailyHoursReportDTO> getDailyHoursByEmployee(Long employeeId) {
        return timesheetItemRepository.aggregateDailyHoursByEmployee(employeeId)
                .stream()
                .map(row -> DailyHoursReportDTO.builder()
                        .date((LocalDate) row[0])
                        .employeeId(((Number) row[1]).longValue())
                        .employeeName((String) row[2])
                        .commessaId(((Number) row[3]).longValue())
                        .commessaCode((String) row[4])
                        .commessaName((String) row[5])
                        .hours((BigDecimal) row[6])
                        .build())
                .collect(Collectors.toList());
    }


}
