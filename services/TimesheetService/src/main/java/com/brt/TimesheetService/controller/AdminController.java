package com.brt.TimesheetService.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.service.TimesheetDayService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final TimesheetDayService timesheetDayService;

    public AdminController(TimesheetDayService timesheetDayService) {
        this.timesheetDayService = timesheetDayService;
    }

    /**
     * Imposta assenza/malattia su un range di giorni
     * Esempio request body: "SICK" oppure "VACATION"
     */
    @PostMapping("/employees/{employeeId}/timesheets/absence/bulk")
    public ResponseEntity<List<TimesheetDayDTO>> setAbsences(@PathVariable Long employeeId,
                                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                             @RequestBody TimesheetDayDTO dto) {
        AbsenceType absenceType = dto.getAbsenceTypeEnum();
        List<TimesheetDayDTO> created = timesheetDayService.createAbsenceTimesheets(employeeId, startDate, endDate, absenceType);
        return ResponseEntity.status(200).body(created);
    }

    /**
     * Imposta assenza/malattia su un giorno specifico
     * Esempio request body: "SICK" oppure "VACATION"
     */
    @PostMapping("/employees/{employeeId}/timesheets/absence/{date}")
    public ResponseEntity<Void> setAbsence(@PathVariable Long employeeId,
                                           @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                           @RequestBody  TimesheetDayDTO dto) {
        timesheetDayService.createAbsenceTimesheet(employeeId, date, dto.getAbsenceTypeEnum());
        return ResponseEntity.noContent().build();
    }


    /**
     * Override forzato di un timesheet passato
     */
    
    @PostMapping("/employees/{employeeId}/timesheets/override/{date}")
    public ResponseEntity<TimesheetDayDTO> overrideTimesheet(@PathVariable Long employeeId,
                                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate Date,
                                                             @RequestBody TimesheetDayDTO dto) {
        TimesheetDayDTO saved = timesheetDayService.createTimesheet(employeeId, Date, dto, true);
        return ResponseEntity.status(201).body(saved);
    }

}
