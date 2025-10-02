package com.brt.TimesheetService.dto.ReportDTOs;

import java.util.List;

// Report per commessa
public class CommessaReportDTO {
    private final Long commessaId;
    private final String commessaCode;
    private final List<DayCommessaDTO> days;

    public CommessaReportDTO(Long commessaId, String commessaCode, List<DayCommessaDTO> days) {
        this.commessaId = commessaId;
        this.commessaCode = commessaCode;
        this.days = days;
    }

    public Long getCommessaId() { return commessaId; }
    public String getCommessaCode() { return commessaCode; }
    public List<DayCommessaDTO> getDays() { return days; }
}