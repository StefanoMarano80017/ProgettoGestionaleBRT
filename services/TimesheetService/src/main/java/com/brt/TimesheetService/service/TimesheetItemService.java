package com.brt.TimesheetService.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.repository.TimesheetItemRepository;

@Service
public class TimesheetItemService {

    private final TimesheetItemRepository timesheetItemRepository;
    private final CommessaService commessaService;

    public TimesheetItemService(TimesheetItemRepository timesheetItemRepository,
                                CommessaService commessaService) {
        this.timesheetItemRepository = timesheetItemRepository;
        this.commessaService = commessaService;
    }

    // ===========================
    // FINDERS
    // ===========================
    public List<TimesheetItem> findByDay(TimesheetDay day) {
        return timesheetItemRepository.findByTimesheetDay(day);
    }

    public TimesheetItem findById(Long id) {
        return timesheetItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item non trovato: " + id));
    }

    // ===========================
    // CREATE / UPDATE
    // ===========================
    @Transactional
    public TimesheetItem addItem(TimesheetDay day, TimesheetItemDTO dto) {
        TimesheetItem item = mapDTOToEntity(dto, day);
        day.addItem(item);
        return timesheetItemRepository.save(item);
    }

    @Transactional
    public TimesheetItem updateItem(Long itemId, TimesheetItemDTO dto) {
        TimesheetItem item = findById(itemId);
        item.setDescription(dto.getDescription());
        item.setHours(dto.getHours());

        if (dto.getCommessaCode() != null) {
            Commessa commessa = commessaService.getCommessa(dto.getCommessaCode());
            item.setCommessa(commessa);
        }

        return timesheetItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        if (!timesheetItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Item non trovato: " + itemId);
        }
        timesheetItemRepository.deleteById(itemId);
    }

    // ===========================
    // BATCH / MERGE ITEMS
    // ===========================
    @Transactional
    public void replaceItems(TimesheetDay day, List<TimesheetItemDTO> dtos) {
        // Rimuove tutti gli item esistenti
        day.getItems().clear();

        if (dtos != null) {
            // Usa un map per sommare le ore per lo stesso commessaCode
            Map<String, TimesheetItemDTO> mergedItems = new HashMap<>();
            for (TimesheetItemDTO dto : dtos) {
                String code = dto.getCommessaCode();
                if (code == null) continue;
                mergedItems.merge(code, dto, (existing, incoming) -> {
                    existing.setHours(existing.getHours().add(incoming.getHours()));
                    return existing;
                });
            }

            // Aggiunge gli item fusi
            for (TimesheetItemDTO dto : mergedItems.values()) {
                day.addItem(mapDTOToEntity(dto, day));
            }
        }
    }


    // ===========================
    // MAPPERS
    // ===========================
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
}
