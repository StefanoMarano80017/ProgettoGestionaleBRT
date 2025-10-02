package com.brt.TimesheetService.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;

public interface TimesheetDayRepository extends JpaRepository<TimesheetDay, Long> {

    // recupera il timesheet per un dipendente e un giorno specifico
    Optional<TimesheetDay> findByEmployeeAndDate(Employee employee, LocalDate date);

    // tutti i giorni di un dipendente in un mese
    Page<TimesheetDay> findByEmployeeAndDateBetween(Employee employee, LocalDate start, LocalDate end, Pageable pageable);

    // tutti i timesheet di un mese (per aggregazioni)
    List<TimesheetDay> findByDateBetween(LocalDate start, LocalDate end);
}
