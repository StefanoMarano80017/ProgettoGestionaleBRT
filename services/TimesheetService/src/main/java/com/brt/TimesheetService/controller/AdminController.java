package com.brt.TimesheetService.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.service.EmployeeService;
import com.brt.TimesheetService.service.TimesheetDayService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final TimesheetDayService timesheetDayService;
    private final EmployeeService employeeService;

    public AdminController(TimesheetDayService timesheetDayService,
                           EmployeeService employeeService) {
        this.timesheetDayService = timesheetDayService;
        this.employeeService = employeeService;
    }

    /**
     * Imposta assenza/malattia su un giorno specifico
     * Esempio request body: "SICK" oppure "VACATION"
     */
    @PatchMapping("/timesheets/{employeeId}/{date}/absence")
    public ResponseEntity<Void> setAbsence(@PathVariable Long employeeId,
                                           @PathVariable String date,
                                           @RequestBody AbsenceType absenceType) {

        // Recupera il dipendente
        Employee employee = employeeService.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Dipendente non trovato"));

        // Recupera o crea il timesheet del giorno
        TimesheetDayDTO dayDTO = timesheetDayService.getTimesheet(employeeId, date);
        dayDTO.setAbsenceType(absenceType);
        dayDTO.setStatus(null); // mutualmente esclusivo

        // Salva aggiornamento come admin
        //timesheetDayService.saveTimesheet(employeeId, date, dayDTO, true, employee);

        return ResponseEntity.noContent().build();
    }

    /**
     * Override forzato di un timesheet passato
     */
    @PostMapping("/timesheets/{employeeId}/{date}/override")
    public ResponseEntity<Void> overrideTimesheet(@PathVariable Long employeeId,
                                                  @PathVariable String date,
                                                  @RequestBody TimesheetDayDTO dto) {

        Employee employee = employeeService.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Dipendente non trovato"));

        // Forza l’aggiornamento usando saveTimesheet come admin
        //timesheetDayService.saveTimesheet(employeeId, date, dto, true, employee);

        return ResponseEntity.noContent().build();
    }

}
