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
import java.util.function.Function;

import org.springframework.stereotype.Service;

import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Commessa;
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
        // 2. Esegui l'azione centrale
        R result = action.apply(day);
        // 3. Aggiorna lo status basato sulle ore
        updateStatus(day);
        return result;
    }

    // ===========================
    // OPERAZIONI SUL DOMINIO
    // ===========================

    public TimesheetItem addItem(TimesheetDay day, TimesheetItemDTO dto, boolean isAdmin) {
        return withTimesheetRules(day, d -> {
            TimesheetItem existing = d.getItems()
                        .stream()
                        .filter(
                            i -> i.getCommessa() != null && i.getCommessa().getCode().equals(dto.getCommessaCode())
                        )
                        .findFirst().orElse(null);
            if (existing != null) {
                BigDecimal newHours = existing.getHours().add(dto.getHours());
                existing.setHours(newHours);
                return existing;
            } else {
                TimesheetItem item = mapDTOToEntity(dto, d);
                d.addItem(item);
                return item;
            }
        });
    }

    public TimesheetItem updateItem(TimesheetDay day, TimesheetItemDTO dto, boolean isAdmin) {
        return withTimesheetRules(day, d -> {
            TimesheetItem item = d.getItems().stream()
                    .filter(i -> i.getId().equals(dto.getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Item non trovato"));

            if (dto.getCommessaCode() == null) {
                throw new IllegalArgumentException("CommessaCode mancante");
            }

            Commessa commessa = commessaRepository.findByCode(dto.getCommessaCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata: " + dto.getCommessaCode()));

            item.setCommessa(commessa);
            item.setDescription(dto.getDescription());
            item.setHours(dto.getHours());
            return item;
        });
    }

    public void deleteItem(TimesheetDay day, Long itemId, boolean isAdmin) {
        withTimesheetRules(day, d -> {
            TimesheetItem item = d.getItems().stream()
                    .filter(i -> i.getId().equals(itemId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Item non trovato"));
            d.removeItem(item);
            return null;
        });
    }

    public void setAbsence(TimesheetDay day, AbsenceType absenceType, boolean isAdmin) {
        withTimesheetRules(day, d -> {
            if (!d.getItems().isEmpty()) d.getItems().clear();
            d.setAbsenceType(absenceType);
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
        return TimesheetItem.builder().description(dto.getDescription()).hours(dto.getHours())
                .timesheetDay(day).commessa(commessa).build();
    }
}
