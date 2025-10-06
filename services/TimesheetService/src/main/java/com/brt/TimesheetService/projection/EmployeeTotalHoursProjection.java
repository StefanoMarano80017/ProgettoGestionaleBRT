package com.brt.TimesheetService.projection;
import java.math.BigDecimal;

// Ore totali per dipendente
public record EmployeeTotalHoursProjection(
    Long employeeId,
    String employeeName,
    BigDecimal totalHours
) {}