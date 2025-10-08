package com.brt.TimesheetService.modules.user.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.modules.user.domain.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Trova tutti i dipendenti con un nome specifico
    List<Employee> findByName(String name);

    // Trova tutti i dipendenti il cui nome contiene una certa stringa (case-insensitive)
    List<Employee> findByNameContainingIgnoreCase(String namePart);

}
