package com.brt.TimesheetService.dto.ReportDTOs;

import java.math.BigDecimal;

// Ore di un dipendente in un giorno
public class EmployeeHoursDTO {
    private final Long employeeId;
    private final String employeeName;
    private final BigDecimal hours;

    public EmployeeHoursDTO(Long employeeId, String employeeName, BigDecimal hours) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.hours = hours;
    }

    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public BigDecimal getHours() { return hours; }
}