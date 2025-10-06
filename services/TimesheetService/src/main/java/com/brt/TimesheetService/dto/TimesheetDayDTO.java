package com.brt.TimesheetService.dto;

import java.time.LocalDate;
import java.util.List;

import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.TimesheetStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;

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
    private String absenceTypeStr;   
    private List<TimesheetItemDTO> items;

    // Metodo helper per ottenere l'enum
    @JsonIgnore
    public AbsenceType getAbsenceTypeEnum() {
        if (absenceTypeStr == null || absenceTypeStr.isEmpty()) return AbsenceType.NONE; // default
        try {
            return AbsenceType.valueOf(absenceTypeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo di assenza non valido: " + absenceTypeStr);
        }
    }
}
