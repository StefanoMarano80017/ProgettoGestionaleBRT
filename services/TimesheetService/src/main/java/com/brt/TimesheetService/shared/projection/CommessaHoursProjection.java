package com.brt.TimesheetService.shared.projection;

import java.math.BigDecimal;

// Ore totali per commessa (senza employeeNames nella query)
public record CommessaHoursProjection(
        Long commessaId,
        String commessaCode,
        BigDecimal totalHours
        ) {

}
