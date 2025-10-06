package com.brt.TimesheetService.controller;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.CommessaHoursDTO;
import com.brt.TimesheetService.projection.DailyHoursReportProjection;
import com.brt.TimesheetService.projection.EmployeeCommessaHoursProjection;
import com.brt.TimesheetService.projection.EmployeeTotalHoursProjection;
import com.brt.TimesheetService.service.ReportService;
import com.brt.TimesheetService.util.PageableUtils;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // ================================================
    // Report ore del dipendenti per commessa configurabile per commessa e periodo
    // ================================================
    @GetMapping("/employee/{employeeId}/hours")
    public ResponseEntity<Page<EmployeeCommessaHoursProjection>> getEmployeeHours(
        @PathVariable Long employeeId,
        @RequestParam(required = false) String commessaCode,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String direction
    ) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();

        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);

        Page<EmployeeCommessaHoursProjection> result;
        if (commessaCode != null && !commessaCode.isEmpty()) {
            result = reportService.getEmployeeHoursForCommessa(employeeId, commessaCode, startDate, endDate, pageable);
        } else {
            result = reportService.getEmployeeHoursAllCommesse(employeeId, startDate, endDate, pageable);
        }
        return ResponseEntity.ok(result);
    }


    // ================================================
    // Report giornaliero per commessa (tutti i dipendenti) configurabile per commessa e periodo
    // ================================================
    @GetMapping("/daily-hours/commesse")
    public ResponseEntity<Page<DailyHoursReportProjection>> getDailyHoursCommesse(
        @RequestParam(required = false) String commessaCode,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String direction
    ) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);
        Page<DailyHoursReportProjection> result;
        if (commessaCode != null && !commessaCode.isEmpty()) {
            result = reportService.getReportForSingleCommessa(commessaCode, startDate, endDate, pageable);
        } else {
            result = reportService.getReportGroupedByCommessaOptimized(startDate, endDate, pageable);
        }
        return ResponseEntity.ok(result);
    }

    // ================================================
    // Report totale ore per commessa per dipendente
    // ================================================
    @GetMapping("/commessa/TotalHours")
    public ResponseEntity<Page<CommessaHoursDTO>> getTotalHoursByCommessaForEmployee(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String direction
    ) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);
        Page<CommessaHoursDTO> result = reportService.getTotalHoursByCommessa(startDate, endDate, pageable);
        return ResponseEntity.ok(result);
    }

    // ================================================
    // Report ore totali per dipendente
    // ================================================
    @GetMapping("/employee/hours/total")
    public ResponseEntity<Page<EmployeeTotalHoursProjection>> getTotalHoursByEmployee(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String direction
    ) {
        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Page<EmployeeTotalHoursProjection> result = reportService.getTotalHoursByEmployee(startDate, endDate, pageable);
        return ResponseEntity.ok(result);
    }

    // Report ore totali per dipendente su una singola commessa
    @GetMapping("/commessa/{commessaCode}/employees/hours")
    public ResponseEntity<Page<EmployeeCommessaHoursProjection>> getTotalHoursPerEmployeeForCommessa(
        @PathVariable String commessaCode,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String direction
    ) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);
        Page<EmployeeCommessaHoursProjection> result =  reportService.getTotalHoursPerEmployeeForCommessa(commessaCode, startDate, endDate, pageable);
        return ResponseEntity.ok(result);
    }
}
