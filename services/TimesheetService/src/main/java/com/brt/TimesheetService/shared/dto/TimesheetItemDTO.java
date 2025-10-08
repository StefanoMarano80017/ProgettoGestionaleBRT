package com.brt.TimesheetService.shared.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class TimesheetItemDTO {

    private Long id;
    private String CommessaCode;
    private String description;
    private BigDecimal hours;
}
