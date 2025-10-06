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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Service;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.exception.TimesheetValidationException;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.model.TimesheetStatus;
import com.brt.TimesheetService.repository.CommessaRepository;

@Service
public class TimesheetDomainService {

    private static final double FULL_WORKDAY_HOURS = 8.0;
    private final CommessaRepository commessaRepository;

    public TimesheetDomainService(CommessaRepository commessaRepository) {
        this.commessaRepository = commessaRepository;
    }

    // ===========================
    // TEMPLATE METHOD
    // ===========================
    private <R> R withTimesheetRules(TimesheetDay day, Function<TimesheetDay, R> action) {
        // 1. Esegui l'azione centrale
        R result = action.apply(day);
        // 2. Aggiorna lo status basato sulle ore
        updateStatus(day);
        return result;
    }

    // ===========================
    // CREAZIONE / AGGIORNAMENTO DEL TIMESHEET
    // ===========================
    public TimesheetDay createTimesheet(TimesheetDayDTO dto) {
        return withTimesheetRules(new TimesheetDay(), d ->{
            d.setDate(dto.getDate());
            // Imposta il tipo di assenza, se presente
            AbsenceType absenceType = dto.getAbsenceTypeEnum();
            if (absenceType != null) {
                d.setAbsenceType(absenceType);
            } else {
                dto.getItems().forEach(itemDTO -> addItemAction(d, itemDTO));
            }
            return d;
        });
    }

    public TimesheetDay updateTimesheet(TimesheetDay existingDay, TimesheetDayDTO dto) {
        return withTimesheetRules(existingDay, existingd -> {
            // Aggiorna tipo di assenza
            AbsenceType newAbsence = dto.getAbsenceTypeEnum();            
            // Se è un giorno di assenza, rimuove gli items
            if (newAbsence == null || newAbsence == AbsenceType.NONE) {
                return setAbsenceAction(existingd, newAbsence);
            } else if (dto.getItems() == null || dto.getItems().isEmpty()) {
                throw new IllegalArgumentException("Dto senza items per un giorno non di assenza");
            }
            // Se invece non è assenza, sincronizza gli items
            // 1 - Elimina item non più presenti nel DTO
            existingd.getItems().removeIf(existing -> dto.getItems().stream().noneMatch(i -> i.getId() != null && i.getId().equals(existing.getId())));
            // 2️ - Aggiorna o aggiunge nuovi item
            for (TimesheetItemDTO itemDTO : dto.getItems()) {
                 addItemAction(existingd, itemDTO);
            }
            return existingd;
        });
    }

    public TimesheetDay setAbsence(TimesheetDay day, AbsenceType absenceType) {
        if (absenceType == null || absenceType == AbsenceType.NONE) {
            throw new IllegalArgumentException("AbsenceType non può essere null o NONE");
        }
        return withTimesheetRules(day, d -> {
            return setAbsenceAction(day, absenceType);
        });
    }

    private TimesheetDay setAbsenceAction(TimesheetDay day, AbsenceType absenceType){
        day.getItems().clear();
        day.setAbsenceType(absenceType);
        return day;
    }
                                                     
    public List<TimesheetDay> setAbsences(Employee employee, LocalDate startDate, LocalDate endDate, AbsenceType absenceType){
        if (startDate == null || endDate == null) {
            throw new TimesheetValidationException("Le date di inizio e fine non possono essere nulle");
        }
        if (endDate.isBefore(startDate)) {
            throw new TimesheetValidationException("La data di fine non può essere precedente alla data di inizio");
        }     
        List<TimesheetDay> createdDays = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            TimesheetDay day = TimesheetDay.builder().employee(employee).date(date).absenceType(absenceType).status(null).build();
            createdDays.add(setAbsenceAction(day, absenceType));
        }
        return createdDays;
    }


    // ===========================
    // OPERAZIONI SU ITEMS
    // ===========================

    // ===========================
    // POST: crea o somma ore se esiste già
    // ===========================
    public TimesheetItem addItem(TimesheetDay day, TimesheetItemDTO dto) {
        return withTimesheetRules(day, d -> addItemAction(d, dto));
    }

    // ===========================
    // PUT: crea o sostituisce ore se esiste già
    // ===========================
    public TimesheetItem putItem(TimesheetDay day, TimesheetItemDTO dto) {
        return withTimesheetRules(day, d -> createItemAction(day, dto));
    }

    // ==========================
    // ACTIONS
    // ===========================

    /**
     * Se l'item con la stessa commessa esiste somma ore 
     * Altrimenti crea un nuovo item.
     */
    private TimesheetItem addItemAction(TimesheetDay day, TimesheetItemDTO dto) {
        TimesheetItem existingItem = findTimesheetItem(day, dto.getCommessaCode());
        if (existingItem != null) {
            return mergeItemAction(existingItem, dto);
        } else {
            return createItemAction(day, dto);
        }
    }

    private TimesheetItem createItemAction(TimesheetDay day, TimesheetItemDTO dto) {
        TimesheetItem item = mapDTOToEntity(dto, day);
        day.addItem(item);
        return item;
    }

    private TimesheetItem mergeItemAction(TimesheetItem item, TimesheetItemDTO dto) {
        BigDecimal newHours = item.getHours().add(dto.getHours());
        item.setHours(newHours);
        return item;
    }

    private TimesheetItem findTimesheetItem(TimesheetDay day, String commessaCode) {
        return day.getItems().stream()
                .filter(i -> i.getCommessa() != null && i.getCommessa().getCode().equals(commessaCode))
                .findFirst()
                .orElse(null);
    }
    
    public void deleteItem(TimesheetDay day, Long itemId) {
        withTimesheetRules(day, d -> {
            TimesheetItem item = d.getItems().stream()
                    .filter(i -> i.getId().equals(itemId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Item non trovato"));
            d.removeItem(item);
            return null;
        });
    }

    // ===========================
    // HELPERS
    // ===========================
    private void updateStatus(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != AbsenceType.NONE) {
            day.setStatus(null);
            return;
        }

        double totalHours = day.getItems().stream()
                .mapToDouble(i -> i.getHours() != null ? i.getHours().doubleValue() : 0.0)
                .sum();

        TimesheetStatus status;
        if (totalHours == 0.0) status = TimesheetStatus.EMPTY;
        else if (totalHours < FULL_WORKDAY_HOURS) status = TimesheetStatus.INCOMPLETE;
        else status = TimesheetStatus.COMPLETE;
        day.setStatus(status);
    }

    private TimesheetItem mapDTOToEntity(TimesheetItemDTO dto, TimesheetDay day) {
        Commessa commessa = commessaRepository.findByCode(dto.getCommessaCode())
                .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata: " + dto.getCommessaCode()));
        return TimesheetItem.builder().description(dto.getDescription()).hours(dto.getHours()).timesheetDay(day).commessa(commessa).build();
    }
}
