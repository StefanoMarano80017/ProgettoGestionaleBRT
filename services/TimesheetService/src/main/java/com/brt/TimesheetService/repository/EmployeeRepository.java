package com.brt.TimesheetService.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.brt.TimesheetService.model.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByUsername(String username);
}
