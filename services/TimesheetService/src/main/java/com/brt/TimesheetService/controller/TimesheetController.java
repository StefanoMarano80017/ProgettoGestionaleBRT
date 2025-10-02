package com.brt.TimesheetService.controller;

import java.time.YearMonth;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.service.TimesheetDayService;

@RestController
@RequestMapping("/employees/{employeeId}/timesheets")
public class TimesheetController {

    private final TimesheetDayService timesheetDayService;

    public TimesheetController(TimesheetDayService timesheetDayService) {
        this.timesheetDayService = timesheetDayService;
    }

    @GetMapping
    public ResponseEntity<Page<TimesheetDayDTO>> getTimesheets(
            @PathVariable Long employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        YearMonth ym = (year != null && month != null) ? YearMonth.of(year, month) : null;
        Pageable pageable = PageRequest.of(page, size);
        Page<TimesheetDayDTO> dtos = timesheetDayService.getTimesheets(employeeId, ym, startDate, endDate, pageable);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{date}")
    public ResponseEntity<TimesheetDayDTO> getTimesheet(@PathVariable Long employeeId, @PathVariable String date) {
        TimesheetDayDTO dto = timesheetDayService.getTimesheet(employeeId, date);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{date}")
    public ResponseEntity<TimesheetDayDTO> saveTimesheet(@PathVariable Long employeeId,
                                                         @PathVariable String date,
                                                         @RequestBody TimesheetDayDTO dto) {

        TimesheetDayDTO saved = timesheetDayService.createTimesheetEmployee(employeeId, date, dto);
        return ResponseEntity.status(201).body(saved);
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteTimesheet(@PathVariable Long employeeId, @PathVariable String date) {
        timesheetDayService.deleteTimesheet(employeeId, date);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{date}/items")
    public ResponseEntity<TimesheetItemDTO> addItem(@PathVariable Long employeeId,
                                                    @PathVariable String date,
                                                    @RequestBody TimesheetItemDTO itemDTO) {
        TimesheetItemDTO saved = timesheetDayService.addItem(employeeId, date, itemDTO);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{date}/items/{itemId}")
    public ResponseEntity<TimesheetItemDTO> updateItem(@PathVariable Long employeeId,
                                                       @PathVariable String date,
                                                       @PathVariable Long itemId,
                                                       @RequestBody TimesheetItemDTO itemDTO) {
        TimesheetItemDTO updated = timesheetDayService.updateItem(employeeId, date, itemId, itemDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{date}/items/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long employeeId,
                                           @PathVariable String date,
                                           @PathVariable Long itemId) {
        timesheetDayService.deleteItem(employeeId, date, itemId);
        return ResponseEntity.noContent().build();
    }
}