package com.brt.TimesheetService.shared.projection;

import java.math.BigDecimal;
// Ore per commessa per un dipendente

public record EmployeeCommessaHoursProjection(
        Long employeeId,
        String employeeName,
        Long commessaId,
        String commessaCode,
        BigDecimal totalHours
        ) {

}
