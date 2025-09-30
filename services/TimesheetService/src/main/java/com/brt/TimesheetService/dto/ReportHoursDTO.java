package com.brt.TimesheetService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportHoursDTO {

    private Long employeeId;      // opzionale, se report per dipendente
    private String employeeName;  // opzionale
    private Long commessaId;      // opzionale, se report per commessa
    private String commessaCode;  // opzionale
    private String commessaName;  // opzionale
    private BigDecimal totalHours;

    /**
     * Crea un DTO per ore di un dipendente
     */
    public static ReportHoursDTO forEmployee(Long employeeId, String employeeName, BigDecimal totalHours) {
        return ReportHoursDTO.builder()
                .employeeId(employeeId)
                .employeeName(employeeName)
                .totalHours(totalHours)
                .build();
    }

    /**
     * Crea un DTO per ore di una commessa
     */
    public static ReportHoursDTO forCommessa(Long commessaId, String commessaCode, String commessaName, BigDecimal totalHours) {
        return ReportHoursDTO.builder()
                .commessaId(commessaId)
                .commessaCode(commessaCode)
                .commessaName(commessaName)
                .totalHours(totalHours)
                .build();
    }
}
