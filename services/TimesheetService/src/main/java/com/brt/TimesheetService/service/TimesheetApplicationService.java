/*
 *   Copyright (c) 2025 Stefano Marano https://github.com/StefanoMarano80017
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package com.brt.TimesheetService.service;

import com.brt.TimesheetService.model.*;
import com.brt.TimesheetService.repository.TimesheetDayRepository;
import com.brt.TimesheetService.service.Validator.TimesheetValidator.*;
import com.brt.TimesheetService.repository.EmployeeRepository;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.projection.*;
import com.brt.TimesheetService.dto.TimesheetItemDTO;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.function.Function;

@Service
@Transactional
public class TimesheetApplicationService {

    private final TimesheetDayRepository timesheetDayRepository;
    private final EmployeeRepository employeeRepository;
    private final TimesheetDomainService domainService;
    private final TimesheetValidator validator;

    public TimesheetApplicationService(TimesheetDayRepository timesheetDayRepository,
                                       EmployeeRepository employeeRepository,
                                       TimesheetDomainService domainService,
                                       TimesheetValidator validator) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.employeeRepository = employeeRepository;
        this.domainService = domainService;
        this.validator = validator;
    }

    // ===========================
    // TEMPLATE METHODS
    // ===========================
    private Employee getEmployeeorThrow(Long employeeId){
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato"));
    }

    private TimesheetDay getTimesheetDayorThrow(Employee employee, LocalDate date) {
        return timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException("Giorno di timesheet non trovato"));
    }

    private boolean isTimesheetDayExists(Long employeeId, LocalDate date) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato"));
        return timesheetDayRepository.existsByEmployeeAndDate(employee, date);
    }

    private <R> R executeOnTimesheet(
        Long employeeId, 
        LocalDate date, 
        OperationContext context, 
        Function<TimesheetDay, R> action
    ){
        Employee employee = getEmployeeorThrow(employeeId);
        TimesheetDay day = getTimesheetDayorThrow(employee, date);
        // Validazione delle regole di business
        validator.validateRules(day, context , employee);
        // Azione centrale delegata al Domain Service
        R result = action.apply(day);
        // Salvataggio della entità aggiornata
        timesheetDayRepository.save(day);
        return result;
    }

    private <R> R executeOnNewTimesheet(Long employeeId, LocalDate date, Function<TimesheetDay, R> action) {
        if (isTimesheetDayExists(employeeId, date)) {
            throw new IllegalStateException("Il timesheet esiste già");
        }
        Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato"));
        TimesheetDay day = TimesheetDay.builder().employee(employee).date(date).build();
        // Azione centrale delegata al Domain Service
        R result = action.apply(day);
        // Salvataggio della entità aggiornata
        timesheetDayRepository.save(day);
        return result;
    }

    // ===========================
    // ACTION METHODS
    // ===========================

    // GET TIMESHEET
    public TimesheetDayProjection getTimesheet(Long employeeId, LocalDate date) {
        return executeOnTimesheet(employeeId, date, TimesheetDayProjection::fromEntity);
    }

    public TimesheetDayProjection getTimesheetEmployee(Long employeeId, LocalDate date) {
        return executeOnNewTimesheet(employeeId, date, TimesheetDayProjection::fromEntity);
    }

    public TimesheetItemProjection addItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheet(employeeId, date, day -> {
            TimesheetItem item = domainService.addItem(day, dto);
            return TimesheetItemProjection.fromEntity(item);
        });
    }

    public TimesheetItemProjection updateItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheet(employeeId, date, day -> {
            TimesheetItem item = domainService.updateItem(day, dto);
            return TimesheetItemProjection.fromEntity(item);
        });
    }

    public TimesheetDayProjection setAbsence(Long employeeId, LocalDate date, AbsenceType absenceType) {
        return executeOnTimesheet(employeeId, date, day -> {
            domainService.setAbsence(day, absenceType);
            return TimesheetDayProjection.fromEntity(day);
        });
    }

    public TimesheetItemProjection deleteItem(Long employeeId, LocalDate date, Long itemId) {
        return executeOnTimesheet(employeeId, date, day -> {
            domainService.deleteItem(day, itemId);
            return null; // o puoi restituire una conferma vuota
        });
    }

    public TimesheetStatusProjection getTimesheetStatus(Long employeeId, LocalDate date) {
        return executeOnTimesheet(employeeId, date, day -> {
            double totalHours = day.getItems().stream()
                    .mapToDouble(i -> i.getHours() != null ? i.getHours() : 0.0)
                    .sum();
            return new TimesheetStatusProjection(day.getDate(), day.getStatus(), totalHours);
        });
    }

    public List<TimesheetItemProjection> getTimesheetItems(Long employeeId, LocalDate date) {
        return executeOnTimesheet(employeeId, date, day ->
                day.getItems().stream()
                        .map(TimesheetItemProjection::fromEntity)
                        .toList()
        );
    }
}
