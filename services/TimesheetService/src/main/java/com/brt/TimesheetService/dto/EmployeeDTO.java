package com.brt.TimesheetService.dto;

import com.brt.TimesheetService.model.Employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO {

    private Long id;
    private String name;

    // Metodo statico per convertire da entity a DTO
    public static EmployeeDTO fromEntity(Employee employee) {
        if (employee == null) return null;

        return EmployeeDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .build();
    }

    // Metodo per convertire DTO in entity
    public Employee toEntity() {
        return Employee.builder()
                .id(this.id)
                .name(this.name)
                .build();
    }
}
