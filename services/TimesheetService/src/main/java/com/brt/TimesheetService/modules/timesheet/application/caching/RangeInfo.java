package com.brt.TimesheetService.modules.timesheet.application.caching;

import java.time.LocalDate;
import java.util.Objects;

public class RangeInfo {

    final RangeKey key;
    final LocalDate startDate;
    final LocalDate endDate;

    public RangeInfo(RangeKey key, LocalDate startDate, LocalDate endDate) {
        this.key = key;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public boolean containsDate(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof RangeInfo other)) {
            return false;
        }
        return Objects.equals(key, other.key);
    }

    @Override
    public int hashCode() {
        return Objects.hash(key);
    }

    @Override
    public String toString() {
        return String.format("RangeInfo[%s-%s, key=%s]", startDate, endDate, key);
    }
}
