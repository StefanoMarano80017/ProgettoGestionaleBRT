package com.brt.TimesheetService.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyHoursReportDTO {

    private LocalDate date;
    private Long employeeId;
    private String employeeName;
    private Long commessaId;
    private String commessaCode;
    private String commessaName;
    private BigDecimal hours;
}
