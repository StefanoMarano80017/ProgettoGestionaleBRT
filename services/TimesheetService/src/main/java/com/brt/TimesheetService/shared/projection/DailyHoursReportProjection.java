package com.brt.TimesheetService.shared.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

// Ore giornaliere per commessa e dipendente
public record DailyHoursReportProjection(
        LocalDate date,
        Long employeeId,
        String employeeName,
        Long commessaId,
        String commessaCode,
        BigDecimal totalHours
        ) {

}
