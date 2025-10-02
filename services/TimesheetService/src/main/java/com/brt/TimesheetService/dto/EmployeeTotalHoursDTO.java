package com.brt.TimesheetService.dto;

import java.math.BigDecimal;

// DTO per aggregazione ore per dipendente
public class EmployeeTotalHoursDTO {
    private final Long employeeId;
    private final String employeeName;
    private final BigDecimal totalHours;

    public EmployeeTotalHoursDTO(Long employeeId, String employeeName, BigDecimal totalHours) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.totalHours = totalHours;
    }

    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public BigDecimal getTotalHours() { return totalHours; }
}
