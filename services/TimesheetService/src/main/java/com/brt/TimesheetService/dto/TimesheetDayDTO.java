package com.brt.TimesheetService.dto;

import java.time.LocalDate;
import java.util.List;

import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.TimesheetStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetDayDTO {
    private Long id;
    private LocalDate date;
    private TimesheetStatus status;
    private AbsenceType absenceType;
    private List<TimesheetItemDTO> items;
}
