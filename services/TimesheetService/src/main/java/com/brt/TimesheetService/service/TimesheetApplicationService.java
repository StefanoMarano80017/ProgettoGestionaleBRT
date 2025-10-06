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

import java.time.LocalDate;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.projection.TimesheetDayProjection;
import com.brt.TimesheetService.projection.TimesheetItemProjection;
import com.brt.TimesheetService.repository.EmployeeRepository;
import com.brt.TimesheetService.repository.TimesheetDayRepository;
import com.brt.TimesheetService.service.Validator.OperationContext;
import com.brt.TimesheetService.service.Validator.TimesheetValidator;


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

    private boolean isTimesheetDayExists(Employee employee, LocalDate date) {
        return timesheetDayRepository.existsByEmployeeAndDate(employee, date);
    }

    /**
     * Template method per operazioni in paginazione su un insieme di TimesheetDay.
     * Gestisce validazione, repository e mapping in output.
     */
    private <R> Page<R> executeOnTimesheetPaged(
            Long employeeId,
            Pageable pageable,
            Function<TimesheetDay, R> mapper,
            BiFunction<Employee, Pageable, Page<TimesheetDay>> queryFn
    ) {
        Employee employee = getEmployeeorThrow(employeeId);
        // Esegue la query paginata definita esternamente
        Page<TimesheetDay> page = queryFn.apply(employee, pageable);
        // Applica il mapping e restituisce Page<R>
        return page.map(mapper);
    }

    private <R> R executeOnTimesheetAdmin(Long employeeId, LocalDate date, Function<TimesheetDay, R> action) {
        return executeOnTimesheet(employeeId, date, OperationContext.ADMIN, action);
    }

    private <R> R executeOnTimesheetUser(Long employeeId, LocalDate date, Function<TimesheetDay, R> action) {
        return executeOnTimesheet(employeeId, date, OperationContext.USER, action);
    }

    private <R> R executeOnTimesheet(
        Long employeeId, 
        LocalDate date, 
        OperationContext context, 
        Function<TimesheetDay, R> action
    ){
        Employee employee = getEmployeeorThrow(employeeId);
        TimesheetDay day  = getTimesheetDayorThrow(employee, date);
        // Validazione delle regole di business
        validator.validateRules(day, context , employee);
        // Azione centrale delegata al Domain Service
        R result = action.apply(day);
        // Salvataggio della entità aggiornata
        timesheetDayRepository.save(day);
        return result;
    }

    private <R> R executeOnNewTimesheetAdmin(Long employeeId, LocalDate date, Function<TimesheetDay, R> action) {
        return executeOnNewTimesheet(employeeId, date, OperationContext.ADMIN, action);
    }

    private <R> R executeOnNewTimesheetUser(Long employeeId, LocalDate date, Function<TimesheetDay, R> action) {
        return executeOnNewTimesheet(employeeId, date, OperationContext.USER, action);
    }

    private <R> R executeOnNewTimesheet(Long employeeId, LocalDate date,  OperationContext context, Function<TimesheetDay, R> action) {
        Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato"));
        if (isTimesheetDayExists(employee, date)) {
            throw new IllegalStateException("Il timesheet esiste già");
        }
        TimesheetDay day = TimesheetDay.builder().employee(employee).date(date).build();
        // Validazione delle regole di business
        validator.validateRules(day, context , employee);
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
        return executeOnTimesheetAdmin(employeeId, date, TimesheetDayProjection::fromEntity);
    }

    public TimesheetDayProjection getTimesheetEmployee(Long employeeId, LocalDate date) {
        return executeOnTimesheetUser(employeeId, date, TimesheetDayProjection::fromEntity);
    }

    public Page<TimesheetDayProjection> getTimesheets(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        LocalDate[] dateArray = validator.parseDateRange(startDate, endDate);
        return executeOnTimesheetPaged(
                employeeId,
                pageable,
                TimesheetDayProjection::fromEntity,
                (employee, pageReq) -> timesheetDayRepository.findByEmployeeAndDateBetween(employee, dateArray[0], dateArray[1], pageReq)
        );
    }

    //==========================
    // CREATE / UPDATE / DELETE TIMESHEET   
    //==========================
    public TimesheetDayProjection saveTimesheetUser(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        if (isTimesheetDayExists(getEmployeeorThrow(employeeId), date)) {
            // Aggiorna un timesheet esistente
            return executeOnTimesheetUser(employeeId, date, day -> {
                day = domainService.updateTimesheet(day, dto);
                return TimesheetDayProjection.fromEntity(day);
            });
        } 
        // Crea un nuovo timesheet
        return executeOnNewTimesheetUser(employeeId, date, day -> {
            domainService.createTimesheet(dto);
            return TimesheetDayProjection.fromEntity(day);
        });
    }

    public TimesheetDayProjection saveTimesheetAdmin(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        if (isTimesheetDayExists(getEmployeeorThrow(employeeId), date)) {
            // Aggiorna un timesheet esistente
            return executeOnTimesheetAdmin(employeeId, date, day -> {
                day = domainService.updateTimesheet(day, dto);
                return TimesheetDayProjection.fromEntity(day);
            });
        } 
        // Crea un nuovo timesheet
        return executeOnNewTimesheetAdmin(employeeId, date, day -> {
            domainService.createTimesheet(dto);
            return TimesheetDayProjection.fromEntity(day);
        });
    }

    public void deleteTimesheetUser(Long employeeId, LocalDate date) {
        executeOnTimesheetUser(employeeId, date, day -> {
            timesheetDayRepository.delete(day);
            return null;
        });
    }

    public void deleteTimesheetAdmin(Long employeeId, LocalDate date) {
        executeOnTimesheetAdmin(employeeId, date, day -> {
            timesheetDayRepository.delete(day);
            return null;
        });
    }

    public TimesheetDayProjection setAbsence(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return executeOnTimesheet(employeeId, date, OperationContext.ADMIN_SET_ABSENCE, day -> {
            day = domainService.setAbsence(day, dto.getAbsenceTypeEnum());
            return TimesheetDayProjection.fromEntity(day);
        });
    }

    public List<TimesheetDayProjection> setAbsences(Long employeeId, LocalDate startDate, LocalDate endDate, AbsenceType absenceType){
        /*
            * Controlla che non esistano già timesheet in quel range
            * Se esistono, lancia eccezione
            * Altrimenti crea i giorni di assenza -> non ho bisogno della validazione poiché azione admin su giorni nuovi 
        */
        Employee employee = getEmployeeorThrow(employeeId);
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (isTimesheetDayExists(getEmployeeorThrow(employeeId), date)) {
                throw new IllegalStateException("Il timesheet del " + date + " esiste già");
            }
        }
        List<TimesheetDay> days = domainService.setAbsences(employee, startDate, endDate, absenceType);
        List<TimesheetDay> newdays = timesheetDayRepository.saveAll(days);
        return newdays.stream().map(TimesheetDayProjection::fromEntity).toList();
    }

    // ===========================
    // OPERAZIONI SU ITEMS  
    // ===========================

    // Crea o aggiorna un item sommando le ore se esiste già
    public TimesheetItemProjection AddOrCreateItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheetUser(employeeId, date, day -> {
            TimesheetItem item = domainService.addItem(day, dto);
            return TimesheetItemProjection.fromEntity(item);
        });
    }

    public TimesheetItemProjection putItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        return executeOnTimesheetUser(employeeId, date, day -> {
            TimesheetItem item = domainService.putItem(day, dto);
            return TimesheetItemProjection.fromEntity(item);
        });
    }

    public TimesheetItemProjection deleteItem(Long employeeId, LocalDate date, Long itemId) {
        return executeOnTimesheetUser(employeeId, date, day -> {
            domainService.deleteItem(day, itemId);
            return null; 
        });
    }
}
