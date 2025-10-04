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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.repository.TimesheetItemRepository;

@Service
public class TimesheetItemService {

    private static final Logger logger = LoggerFactory.getLogger(TimesheetItemService.class);

    private final TimesheetItemRepository timesheetItemRepository;
    private final CommessaService commessaService;
    private final TimesheetUtils timesheetUtils;

    public TimesheetItemService(TimesheetItemRepository timesheetItemRepository, CommessaService commessaService, TimesheetUtils timesheetUtils) {
        this.timesheetItemRepository = timesheetItemRepository;
        this.commessaService = commessaService;
        this.timesheetUtils = timesheetUtils;
    }

    public TimesheetItem findById(Long id) {
        return timesheetItemRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Item non trovato: " + id));
    }

    // ===========================
    // ITEM MANAGEMENT
    // ===========================
    public TimesheetItemDTO addItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        TimesheetDay day  = timesheetUtils.findTimesheetOrThrow(employee, date);
        addItemMerge(day, dto);
        timesheetUtils.updateStatusAndAbsence(day);
        timesheetUtils.mapToDTOAndSave(day);
        return timesheetUtils.mapEntityToDTO(day);
    }

    public TimesheetItemDTO updateItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        TimesheetDay day  = timesheetUtils.findTimesheetOrThrow(employee, date);
        timesheetItemService.updateItem(dto);
        timesheetUtils.updateStatusAndAbsence(day);
        return timesheetItemService.mapEntitiesToDTOs(day.getItems()).stream()
                .filter(i -> itemId.equals(i.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item non trovato dopo update id: " + itemId));
    }

    public void deleteItem(Long employeeId, LocalDate date, Long itemId) {
        verifyTimesheetExists(employeeId, date);
        TimesheetDay day = getOrCreateTimesheet(employeeId, date);
        timesheetItemService.deleteItem(itemId);
        timesheetUtils.updateStatusAndAbsence(day);
        saveAndLog(day, "Item eliminato e timesheet aggiornato");
    }

    private TimesheetDay getOrCreateTimesheet(Long employeeId, LocalDate date) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        return timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElse(TimesheetDay.builder().employee(employee).date(date).build());
    }

    private void verifyTimesheetExists(Long employeeId, LocalDate date) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        if (timesheetDayRepository.findByEmployeeAndDate(employee, date).isEmpty()) {
            throw new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date);
        }
    }

    /**
     * Aggiunge un item al day. Se esiste già un item con la stessa commessa (code),
     * somma le ore sullo stesso item (merge).
     */
    @Transactional
    private TimesheetItem addItemMerge(TimesheetDay day, TimesheetItemDTO dto) {
        String code = dto.getCommessaCode();
        if (code != null) {
            TimesheetItem existing = day.getItems().stream()
                    .filter(i -> i.getCommessa() != null && code.equals(i.getCommessa().getCode()))
                    .findFirst()
                    .orElse(null);

            if (existing != null) {
                double existingHours = safeDouble(existing.getHours());
                double incomingHours = safeDouble(dto.getHours());
                Double newHours = existingHours + incomingHours;
                existing.setHours((java.math.BigDecimal) convertToNumberType(existing.getHours(), newHours));
                logger.info("Merge item esistente commessa={}, ore: {} -> {}", code, existingHours, newHours);
                return timesheetItemRepository.save(existing);
            }else{
                TimesheetItem item = mapDTOToEntity(dto, day);
                day.addItem(item);
                TimesheetItem saved = timesheetItemRepository.save(item);
                logger.info("Aggiunto nuovo item id={}, commessa={}, ore={}", saved.getId(),
                            saved.getCommessa() != null ? saved.getCommessa().getCode() : null,
                            saved.getHours());
                return saved;
            }
        } 
        throw new IllegalArgumentException("Commessa non trovata in item: " + dto);
    }

    @Transactional
    public TimesheetItem updateItem(TimesheetItemDTO dto) {
        TimesheetItem item = findById(dto.getId());
        if (item == null) {
            throw new ResourceNotFoundException("Item non trovato: " + dto.getId());
        }

        if (dto.getCommessaCode() == null) {
                    throw new IllegalArgumentException("Commessa code non trovata in item: " + dto);
        }

        Commessa commessa = commessaService.getCommessa(dto.getCommessaCode());
        item.setCommessa(commessa);
        item.setDescription(dto.getDescription());
        item.setHours(dto.getHours());
        TimesheetItem saved = timesheetItemRepository.save(item);
        logger.info("Aggiornato item id={}, commessa={}, ore={}", saved.getId(), saved.getCommessa() != null ? saved.getCommessa().getCode() : null, saved.getHours());
        return saved;
    }

    @Transactional
    public void deleteItem(Long itemId) {
        if (!timesheetItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Item non trovato: " + itemId);
        }
        timesheetItemRepository.deleteById(itemId);
        logger.info("Eliminato item id={}", itemId);
    }

    /**
     * Sostituisce gli items del day: prima effettua il merge degli input su commessaCode,
     * poi crea gli entity corrispondenti.
     */
    @Transactional
    public void replaceItems(TimesheetDay day, List<TimesheetItemDTO> dtos) {
        day.getItems().clear();
        if (dtos == null || dtos.isEmpty()) return;

        Map<String, TimesheetItemDTO> merged = new HashMap<>();
        for (TimesheetItemDTO dto : dtos) {
            String code = dto.getCommessaCode();
            if (code == null) throw new IllegalArgumentException("Commessa non trovata in item: " + dto);
            merged.merge(code, dto, (existing, incoming) -> {
                Double summed = safeDouble(existing.getHours()) + safeDouble(incoming.getHours());
                existing.setHours((java.math.BigDecimal) convertToNumberType(existing.getHours(), summed));
                return existing;
            });
        }

        for (TimesheetItemDTO mergedDto : merged.values()) {
            TimesheetItem item = mapDTOToEntity(mergedDto, day);
            day.addItem(item);
            // do not save here, will be persisted when the owning TimesheetDay is saved
            logger.debug("ReplaceItems - aggiunto item commessa={}, ore={}", mergedDto.getCommessaCode(), mergedDto.getHours());
        }
    }

    // ---------- MAPPERS ----------

    public TimesheetItem mapDTOToEntity(TimesheetItemDTO dto, TimesheetDay day) {
        Commessa commessa = dto.getCommessaCode() != null ? commessaService.getCommessa(dto.getCommessaCode()) : null;
        return TimesheetItem.builder()
                .id(dto.getId())
                .description(dto.getDescription())
                .hours(dto.getHours())
                .timesheetDay(day)
                .commessa(commessa)
                .build();
    }

    public TimesheetItemDTO mapEntityToDTO(TimesheetItem item) {
        return TimesheetItemDTO.builder()
                .id(item.getId())
                .description(item.getDescription())
                .hours(item.getHours())
                .CommessaCode(item.getCommessa() != null ? item.getCommessa().getCode() : null)
                .build();
    }

    public List<TimesheetItemDTO> mapEntitiesToDTOs(List<TimesheetItem> items) {
        return items.stream().map(this::mapEntityToDTO).collect(Collectors.toList());
    }

    // ---------- HELPERS per tipi ore (null-safe) ----------

    private static double safeDouble(Number n) {
        if (n == null) return 0.0;
        return n.doubleValue();
    }

    /**
     * Converte il valore double risultante nella stessa "classe" numerica dell'originale se possibile.
     * Se original è null, ritorna la Double.
     * Questo mantiene la compatibilità con il tipo numerico memorizzato nell'entity (Integer/Double/BigDecimal).
     */
    private static Number convertToNumberType(Number original, double value) {
        if (original == null) {
            return value;
        }
        if (original instanceof Integer) {
            return (int) Math.round(value);
        }
        if (original instanceof Long) {
            return (long) Math.round(value);
        }
        if (original instanceof Float) {
            return (float) value;
        }
        if (original instanceof java.math.BigDecimal) {
            return java.math.BigDecimal.valueOf(value);
        }
        // Default -> Double
        return value;
    }

}