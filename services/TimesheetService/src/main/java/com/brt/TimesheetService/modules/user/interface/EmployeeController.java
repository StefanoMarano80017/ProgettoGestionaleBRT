package com.brt.TimesheetService.modules.user.

interface
  ;

import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.service.EmployeeService;


import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.EmployeeDTO;

import com.brt.TimesheetService.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees() {
        List<EmployeeDTO> employees = employeeService.findAll().stream().map(EmployeeDTO::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long id) {
        Employee employee = employeeService.findById(id);
        if (employee == null) {
            throw new ResourceNotFoundException("Employee not found: " + id);
        }
        EmployeeDTO dto = EmployeeDTO.fromEntity(employee);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(@RequestBody EmployeeDTO dto) {
        Employee saved = employeeService.save(dto.toEntity());
        return ResponseEntity.status(201).body(EmployeeDTO.fromEntity(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
