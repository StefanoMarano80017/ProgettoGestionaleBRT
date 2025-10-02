package com.brt.TimesheetService.dto.ReportDTOs;

import java.time.LocalDate;
import java.util.List;

// Giorno con lista di dipendenti
public class DayCommessaDTO {
    private final LocalDate date;
    private final List<EmployeeHoursDTO> employees;

    public DayCommessaDTO(LocalDate date, List<EmployeeHoursDTO> employees) {
        this.date = date;
        this.employees = employees;
    }

    public LocalDate getDate() { return date; }
    public List<EmployeeHoursDTO> getEmployees() { return employees; }
}