package com.brt.TimesheetService.controller;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.CommessaHoursDTO;
import com.brt.TimesheetService.dto.DailyHoursReportDTO;
import com.brt.TimesheetService.dto.EmployeeTotalHoursDTO;
import com.brt.TimesheetService.dto.ReportDTOs.EmployeeCommessaHoursDTO;
import com.brt.TimesheetService.service.ReportService;
import com.brt.TimesheetService.service.TimesheetItemService;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;
    private final TimesheetItemService timesheetItemService;

    public ReportController(ReportService reportService, TimesheetItemService timesheetItemService) {
        this.reportService = reportService;
        this.timesheetItemService = timesheetItemService;
    }

    /**
    *   Endpoint per ore dipendente, configurabile per commessa e periodo
    */
    @GetMapping("/employee/{employeeId}/hours")
    public ResponseEntity<Page<EmployeeCommessaHoursDTO>> getEmployeeHours(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String commessaCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Pageable pageable = PageRequest.of(page, size);
        Page<EmployeeCommessaHoursDTO> result;
        if (commessaCode != null && !commessaCode.isEmpty()) {
            result = reportService.getEmployeeHoursForCommessa(employeeId, commessaCode, startDate, endDate, pageable);
        } else {
            result = reportService.getEmployeeHoursAllCommesse(employeeId, startDate, endDate, pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/hours-by-commessa")
    public ResponseEntity<Page<CommessaHoursDTO>> hoursByCommessa(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reportService.getTotalHoursByCommessa(startDate, endDate, pageable));
    }


    // ================================================
    // Report giornaliero per commessa (dipendenti) configurabile per commessa e periodo
    // ================================================
    @GetMapping("/daily-hours/commesse")
    public ResponseEntity<Page<DailyHoursReportDTO>> getDailyHoursCommesse(
            @RequestParam(required = false) String commessaCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();
        Pageable pageable = PageRequest.of(page, size);
        Page<DailyHoursReportDTO> result;
        if (commessaCode != null && !commessaCode.isEmpty()) {
            result = reportService.getReportForSingleCommessa(commessaCode, startDate, endDate, pageable);
        } else {
            result = reportService.getReportGroupedByCommessaOptimized(startDate, endDate, pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/hours-by-employee")
    public ResponseEntity<Page<EmployeeTotalHoursDTO>> getHoursByEmployee(
            @RequestParam Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<EmployeeTotalHoursDTO> result = reportService.getTotalHoursByCommessaForEmployee(employeeId, startDate, endDate, pageable);
        return ResponseEntity.ok(result);
    }

}
