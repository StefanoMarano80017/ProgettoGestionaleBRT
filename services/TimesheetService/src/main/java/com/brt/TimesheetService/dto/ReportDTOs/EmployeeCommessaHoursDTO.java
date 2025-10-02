package com.brt.TimesheetService.dto.ReportDTOs;

import java.math.BigDecimal;


// Ore di un dipendente su una commessa o su tutte le commesse
public class EmployeeCommessaHoursDTO {
    private final Long employeeId;
    private final String employeeName;
    private final Long commessaId;      // può essere null se è aggregato su tutte le commesse
    private final String commessaCode;  // può essere null se è aggregato su tutte le commesse
    private final BigDecimal hours;

    public EmployeeCommessaHoursDTO(Long employeeId, String employeeName,
                                    Long commessaId, String commessaCode, BigDecimal hours) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.commessaId = commessaId;
        this.commessaCode = commessaCode;
        this.hours = hours;
    }

    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public Long getCommessaId() { return commessaId; }
    public String getCommessaCode() { return commessaCode; }
    public BigDecimal getHours() { return hours; }
}
