package com.brt.TimesheetService.controller;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
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
import com.brt.TimesheetService.projection.TimesheetDayProjection;
import com.brt.TimesheetService.projection.TimesheetItemProjection;
import com.brt.TimesheetService.service.TimesheetApplicationService;
import com.brt.TimesheetService.util.PageableUtils;

@RestController
@RequestMapping("/employees/{employeeId}/timesheets")
public class TimesheetController {

    private final TimesheetApplicationService timesheetApplicationService;

    public TimesheetController(TimesheetApplicationService timesheetApplicationService) {
        this.timesheetApplicationService = timesheetApplicationService;
    }

    @GetMapping
    public ResponseEntity<Page<TimesheetDayProjection>> getTimesheets(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction
    ) {
        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);
        Page<TimesheetDayProjection> projections = timesheetApplicationService.getTimesheets(employeeId, startDate, endDate, pageable);
        return ResponseEntity.ok(projections);
    }

    @GetMapping("/{date}")
    public ResponseEntity<TimesheetDayProjection> getTimesheet(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        TimesheetDayProjection projection = timesheetApplicationService.getTimesheet(employeeId, date);
        return ResponseEntity.ok(projection);
    }

    @PostMapping("/{date}")
    public ResponseEntity<TimesheetDayProjection> saveTimesheet(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody TimesheetDayDTO dto
    ) {
        dto.setDate(date);
        TimesheetDayProjection saved = timesheetApplicationService.saveTimesheetUser(employeeId, date, dto);
        return ResponseEntity.status(201).body(saved);
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteTimesheet(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        timesheetApplicationService.deleteTimesheetUser(employeeId, date);
        return ResponseEntity.noContent().build();
    }

    // POST semantics: nel dominio, la creazione di un item sulla stessa commessa
    // equivale a un "merge" (aggiunta ore) invece che un duplicato.
    @PostMapping("/{date}/items")
    public ResponseEntity<TimesheetItemProjection> addItem(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody TimesheetItemDTO itemDTO
    ) {
        TimesheetItemProjection saved = timesheetApplicationService.addOrCreateItem(employeeId, date, itemDTO);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{date}/items")
    public ResponseEntity<TimesheetItemProjection> updateItem(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody TimesheetItemDTO itemDTO
    ) {
        TimesheetItemProjection updated = timesheetApplicationService.putItem(employeeId, date, itemDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{date}/items/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable Long itemId
    ) {
        timesheetApplicationService.deleteItem(employeeId, date, itemId);
        return ResponseEntity.noContent().build();
    }
}
