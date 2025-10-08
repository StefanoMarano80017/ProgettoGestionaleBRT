package com.brt.TimesheetService.modules.timesheet.application.caching;

import java.time.LocalDate;

public record RangeKey(Long employeeId, LocalDate start, LocalDate end, int page, int size) {

    @Override
    public String toString() {
        return String.format("RangeKey[emp=%d, %s->%s, p%d, s%d]", employeeId, start, end, page, size);
    }
}
