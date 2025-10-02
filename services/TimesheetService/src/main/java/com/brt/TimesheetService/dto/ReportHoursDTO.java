package com.brt.TimesheetService.dto;

import java.math.BigDecimal;

public class ReportHoursDTO {

    private Long employeeId;      
    private String employeeName;  
    private BigDecimal totalHours;

    // Unico costruttore con tutti i campi opzionali
    public ReportHoursDTO(Long employeeId, String employeeName, Long commessaId, String commessaCode, BigDecimal totalHours) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.totalHours = totalHours;
    }

    // Factory method per report commessa
    public static ReportHoursDTO forCommessa(Long commessaId, String commessaCode, BigDecimal totalHours) {
        return new ReportHoursDTO(null, null, commessaId, commessaCode, totalHours);
    }

    // Factory method per report dipendente
    public static ReportHoursDTO forEmployee(Long employeeId, String employeeName, BigDecimal totalHours) {
        return new ReportHoursDTO(employeeId, employeeName, null, null, totalHours);
    }

    public Long getEmployeeId()       { return employeeId; }
    public String getEmployeeName()   { return employeeName; }
    public BigDecimal getTotalHours() { return totalHours; }

    public void setEmployeeId(Long employeeId)       { this.employeeId = employeeId; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public void setTotalHours(BigDecimal totalHours) { this.totalHours = totalHours; }
}
