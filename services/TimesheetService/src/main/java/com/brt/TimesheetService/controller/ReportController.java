package com.brt.TimesheetService.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.DailyHoursReportDTO;
import com.brt.TimesheetService.dto.ReportHoursDTO;
import com.brt.TimesheetService.service.ReportService;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/hours-by-commessa")
    public ResponseEntity<List<ReportHoursDTO>> hoursByCommessa() {
        return ResponseEntity.ok(reportService.getTotalHoursByCommessa());
    }

    @GetMapping("/hours-by-employee")
    public ResponseEntity<List<ReportHoursDTO>> hoursByEmployee() {
        return ResponseEntity.ok(reportService.getTotalHoursByEmployee());
    }
    
    // ================================================
    // Report giornaliero per commessa (dipendenti)
    // ================================================
    @GetMapping("/daily-hours/commessa/{commessaId}")
    public ResponseEntity<List<DailyHoursReportDTO>> getDailyHoursByCommessa(
            @PathVariable Long commessaId) {

        List<DailyHoursReportDTO> result = reportService.getDailyHoursByCommessa(commessaId);
        return ResponseEntity.ok(result);
    }

    // ================================================
    // Report giornaliero per dipendente (commesse)
    // ================================================
    @GetMapping("/daily-hours/employee/{employeeId}")
    public ResponseEntity<List<DailyHoursReportDTO>> getDailyHoursByEmployee(
            @PathVariable Long employeeId) {

        List<DailyHoursReportDTO> result = reportService.getDailyHoursByEmployee(employeeId);
        return ResponseEntity.ok(result);
    }
}
