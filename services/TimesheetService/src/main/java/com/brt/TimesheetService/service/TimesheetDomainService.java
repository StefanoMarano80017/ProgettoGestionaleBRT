package com.brt.TimesheetService.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(TimesheetDomainService.class);
    private static final double FULL_WORKDAY_HOURS = 8.0;
    private final CommessaRepository commessaRepository;

    public TimesheetDomainService(CommessaRepository commessaRepository) {
        this.commessaRepository = commessaRepository;
    }

    // TEMPLATE METHOD
    private <R> R withTimesheetRules(TimesheetDay day, Function<TimesheetDay, R> action) {
        R result = action.apply(day);
        updateStatus(day);
        return result;
    }

    // CREAZIONE / AGGIORNAMENTO TIMESHEET
    // il day viene creato esternamente e passato come parametro, qui imposto solo gli item, stato e assenza. 
    public TimesheetDay createTimesheet(TimesheetDay day, TimesheetDayDTO dto) {
        logger.info("Creazione timesheet per data {}", dto.getDate());
        return withTimesheetRules(day, d -> {
            AbsenceType absenceType = dto.getAbsenceTypeEnum();
            if (absenceType != null && absenceType != AbsenceType.NONE) {
                d.setAbsenceType(absenceType);
                logger.info("Giorno segnato come assenza di tipo {}", absenceType);
            }
            if (dto.getItems() != null && !dto.getItems().isEmpty()) {
                dto.getItems().forEach(itemDTO -> {
                    TimesheetItem item = addItemAction(d, itemDTO);
                    logger.info("Aggiunto item {} ore {} per commessa {}", item.getId(), item.getHours(), item.getCommessa().getCode());
                });
            }
            return d;
        });
    }

    public TimesheetDay updateTimesheet(TimesheetDay existingDay, TimesheetDayDTO dto) {
        logger.info("Aggiornamento timesheet {} per data {}", existingDay.getId(), dto.getDate());
        return withTimesheetRules(existingDay, d -> {
            AbsenceType newAbsence = dto.getAbsenceTypeEnum();
            if (newAbsence != null && newAbsence != AbsenceType.NONE) {
                logger.info("Aggiornamento giorno come assenza {}", newAbsence);
                d.getItems().clear(); // rimuove items se giorno di assenza
                d.setAbsenceType(newAbsence);
            } else {
                d.setAbsenceType(AbsenceType.NONE);
                if (dto.getItems() != null && !dto.getItems().isEmpty()) {
                    // Rimuove items non presenti nel DTO
                    d.getItems().removeIf(existing -> dto.getItems().stream().noneMatch(i -> i.getId() != null && i.getId().equals(existing.getId())));
                    // Aggiorna o aggiunge items
                    for (TimesheetItemDTO itemDTO : dto.getItems()) {
                        TimesheetItem item = addItemAction(d, itemDTO);
                        logger.info("Aggiornato/aggiunto item {} ore {} per commessa {}", item.getId(), item.getHours(), item.getCommessa().getCode());
                    }
                }
            }
            return d;
        });
    }

    public TimesheetDay setAbsence(TimesheetDay day, AbsenceType absenceType) {
        if (absenceType == null || absenceType == AbsenceType.NONE) {
            throw new IllegalArgumentException("AbsenceType non può essere null o NONE");
        }
        logger.info("Impostazione assenza {} per il giorno {}", absenceType, day.getDate());
        return withTimesheetRules(day, d -> {
            d.getItems().clear();
            d.setAbsenceType(absenceType);
            return d;
        });
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
            createdDays.add(setAbsence(day, absenceType));
        }
        return createdDays;
    }

    // OPERAZIONI SU ITEMS
    public TimesheetItem addItem(TimesheetDay day, TimesheetItemDTO dto) {
        return withTimesheetRules(day, d -> addItemAction(d, dto));
    }

    public TimesheetItem putItem(TimesheetDay day, TimesheetItemDTO dto) {
        return withTimesheetRules(day, d -> createItemAction(d, dto));
    }

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
            logger.info("Item {} rimosso dal giorno {}", itemId, day.getDate());
            return null;
        });
    }

    // HELPERS
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
        return TimesheetItem.builder()
                .description(dto.getDescription())
                .hours(dto.getHours())
                .timesheetDay(day)
                .commessa(commessa)
                .build();
    }
}
