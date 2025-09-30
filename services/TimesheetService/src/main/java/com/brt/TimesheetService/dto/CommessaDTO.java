package com.brt.TimesheetService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommessaDTO {
    private Long id;
    private String code;
    private Long progettoId; // riferimento al progetto padre se necessario
}
