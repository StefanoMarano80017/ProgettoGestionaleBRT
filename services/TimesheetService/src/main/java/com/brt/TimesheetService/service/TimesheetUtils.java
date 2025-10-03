package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.model.TimesheetStatus;
import com.brt.TimesheetService.repository.EmployeeRepository;
import com.brt.TimesheetService.repository.TimesheetDayRepository;

public class TimesheetUtils {

    private final EmployeeRepository employeeRepo; 
    private final TimesheetDayRepository dayRepo;

    public TimesheetUtils(EmployeeRepository employeeRepo, TimesheetDayRepository dayRepo) {
        this.employeeRepo = employeeRepo;
        this.dayRepo = dayRepo;
    }

    // ===========================
    // SAFE NUMBER HELPERS
    // ===========================
    public static double safeDouble(Number n) {
        return n == null ? 0.0 : n.doubleValue();
    }

    public static Number convertToNumberType(Number original, double value) {
        if (original == null) return value;
        if (original instanceof Integer) return (int) Math.round(value);
        if (original instanceof Long) return (long) Math.round(value);
        if (original instanceof Float) return (float) value;
        if (original instanceof java.math.BigDecimal) return java.math.BigDecimal.valueOf(value);
        return value;
    }

    // ===========================
    // ENTITY HELPERS
    // ===========================
    public Employee getEmployeeOrThrow(Long employeeId) {
        return employeeRepo.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato: " + employeeId));
    }

    public TimesheetDay findTimesheetOrThrow(Employee employee, LocalDate date) {
        return dayRepo.findByEmployeeAndDate(employee, date).orElseThrow(() -> new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date));
    }

    // ===========================
    // MAPPERS
    // ===========================
    public static TimesheetItem mapDTOToEntity(TimesheetItemDTO dto, TimesheetDay day, CommessaService commessaService) {
        Commessa commessa = dto.getCommessaCode() != null ? commessaService.getCommessa(dto.getCommessaCode()) : null;
        return TimesheetItem.builder()
                .id(dto.getId())
                .description(dto.getDescription())
                .hours(dto.getHours())
                .timesheetDay(day)
                .commessa(commessa)
                .build();
    }

    public static TimesheetItemDTO mapEntityToDTO(TimesheetItem item) {
        return TimesheetItemDTO.builder()
                .id(item.getId())
                .description(item.getDescription())
                .hours(item.getHours())
                .CommessaCode(item.getCommessa() != null ? item.getCommessa().getCode() : null)
                .build();
    }

    public static List<TimesheetItemDTO> mapEntitiesToDTOs(List<TimesheetItem> items) {
        return items.stream().map(TimesheetUtils::mapEntityToDTO).collect(Collectors.toList());
    }

    private static final double FULL_WORKDAY_HOURS = 8.0;
    public void updateStatusAndAbsence(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != AbsenceType.NONE) {
            day.setStatus(null);
        } else {
            double totalHours = day.getItems().stream()
                    .mapToDouble(i -> i.getHours() != null ? i.getHours().doubleValue() : 0.0)
                    .sum();
            TimesheetStatus newStatus;
            if (totalHours == 0.0) {
                newStatus = TimesheetStatus.EMPTY;
            } else if (totalHours < FULL_WORKDAY_HOURS) {
                newStatus = TimesheetStatus.INCOMPLETE;
            } else {
                newStatus = TimesheetStatus.COMPLETE;
            }
            day.setStatus(newStatus);
        }
    }

}
