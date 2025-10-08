package com.brt.TimesheetService.shared.dto;

import java.math.BigDecimal;
import java.util.List;

// DTO per aggregazione ore per commessa
public class CommessaHoursDTO {

    private final Long commessaId;
    private final String commessaCode;
    private final BigDecimal totalHours;
    private final List<String> employeeNames;

    public CommessaHoursDTO(Long commessaId, String commessaCode, BigDecimal totalHours, List<String> employeeNames) {
        this.commessaId = commessaId;
        this.commessaCode = commessaCode;
        this.totalHours = totalHours;
        this.employeeNames = employeeNames;
    }

    public Long getCommessaId() {
        return commessaId;
    }

    public String getCommessaCode() {
        return commessaCode;
    }

    public BigDecimal getTotalHours() {
        return totalHours;
    }

    public List<String> getEmployeeNames() {
        return employeeNames;
    }
}
