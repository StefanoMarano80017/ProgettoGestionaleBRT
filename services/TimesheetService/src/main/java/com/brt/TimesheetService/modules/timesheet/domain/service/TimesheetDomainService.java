package com.brt.TimesheetService.modules.timesheet.domain.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.brt.TimesheetService.modules.commessa.domain.Commessa;
import com.brt.TimesheetService.modules.commessa.infrastructure.CommessaRepository;
import com.brt.TimesheetService.modules.timesheet.domain.AbsenceType;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetDay;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetItem;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetStatus;
import com.brt.TimesheetService.modules.user.domain.Employee;
import com.brt.TimesheetService.shared.dto.TimesheetDayDTO;
import com.brt.TimesheetService.shared.dto.TimesheetItemDTO;
import com.brt.TimesheetService.shared.exception.ResourceNotFoundException;
import com.brt.TimesheetService.shared.exception.TimesheetValidationException;

/**
 * Domain service che contiene la logica di business pura per il timesheet.
 *
 * NOTE: - Questo service non esegue persist (evitato intenzionalmente) — il
 * livello superiore (ApplicationService) si occupa di salvare l'entità e
 * restituire lo stato finale. - Tutti i metodi fanno validation primaria e
 * lanciano TimesheetValidationException/ResourceNotFoundException.
 */
@Service
public class TimesheetDomainService {

    private static final Logger logger = LoggerFactory.getLogger(TimesheetDomainService.class);

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal FULL_WORKDAY_HOURS = BigDecimal.valueOf(8);

    private final CommessaRepository commessaRepository;

    public TimesheetDomainService(CommessaRepository commessaRepository) {
        this.commessaRepository = commessaRepository;
    }

    // =========================
    // Template method (wrap action with rules enforcement)
    // =========================
    private <R> R withTimesheetRules(TimesheetDay day, Function<TimesheetDay, R> action) {
        Objects.requireNonNull(day, "timesheet day cannot be null");
        R result = action.apply(day);
        updateStatus(day);
        return result;
    }

    // =========================
    // CREATE / UPDATE TIMESHEET
    // =========================
    /**
     * Crea un nuovo TimesheetDay (il day è fornito dal caller). Applica
     * items/absence dal DTO e aggiorna status. Non esegue persist — caller deve
     * salvare l'entità e restituirla.
     */
    public TimesheetDay createTimesheet(TimesheetDay day, TimesheetDayDTO dto) {
        Objects.requireNonNull(dto, "TimesheetDayDTO non può essere null");
        logger.info("Creazione timesheet per data {}", dto.getDate());

        return withTimesheetRules(day, d -> {
            AbsenceType absenceType = dto.getAbsenceTypeEnum();
            if (absenceType != null && absenceType != AbsenceType.NONE) {
                d.setAbsenceType(absenceType);
                logger.debug("Giorno segnato come assenza di tipo {}", absenceType);
                // ensure items cleared on absence
                d.getItems().clear();
            } else {
                d.setAbsenceType(AbsenceType.NONE);
            }

            if (dto.getItems() != null && !dto.getItems().isEmpty()) {
                for (TimesheetItemDTO itemDTO : dto.getItems()) {
                    validateItemDTO(itemDTO);
                    TimesheetItem item = addItemAction(d, itemDTO);
                    logger.debug("Aggiunto item (temp-id={}) ore {} per commessa {}", item.getId(), safeHours(item.getHours()), safeCommessaCode(item));
                }
            }
            return d;
        });
    }

    /**
     * Aggiorna un timesheet esistente basandosi sul DTO. Rimuove items non
     * presenti nel DTO, aggiorna o aggiunge quelli presenti.
     */
    public TimesheetDay updateTimesheet(TimesheetDay existingDay, TimesheetDayDTO dto) {
        Objects.requireNonNull(dto, "TimesheetDayDTO non può essere null");
        logger.info("Aggiornamento timesheet {} per data {}", existingDay.getId(), dto.getDate());

        return withTimesheetRules(existingDay, d -> {
            AbsenceType newAbsence = dto.getAbsenceTypeEnum();
            if (newAbsence != null && newAbsence != AbsenceType.NONE) {
                logger.debug("Impostazione assenza {} e rimozione items esistenti", newAbsence);
                d.getItems().clear();
                d.setAbsenceType(newAbsence);
            } else {
                d.setAbsenceType(AbsenceType.NONE);
                if (dto.getItems() != null) {
                    // Rimuove items non presenti nel DTO (basato su id se presente)
                    d.getItems().removeIf(existing -> dto.getItems().stream().noneMatch(i -> i.getId() != null && i.getId().equals(existing.getId())));
                    // Aggiorna o aggiunge items
                    for (TimesheetItemDTO itemDTO : dto.getItems()) {
                        validateItemDTO(itemDTO);
                        TimesheetItem item = addItemAction(d, itemDTO);
                        logger.debug("Aggiornato/aggiunto item {} ore {} per commessa {}", item.getId(), safeHours(item.getHours()), safeCommessaCode(item));
                    }
                }
            }
            return d;
        });
    }

    /**
     * Segna un giorno come assenza (uso admin). Rimuove items e imposta
     * absenceType.
     */
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

    /**
     * Crea days con assenze tra startDate e endDate inclusi. Non salva: il
     * caller salva i giorni restituiti.
     */
    public List<TimesheetDay> setAbsences(Employee employee, LocalDate startDate, LocalDate endDate, AbsenceType absenceType) {
        if (employee == null) {
            throw new TimesheetValidationException("Employee non può essere null");
        }
        if (startDate == null || endDate == null) {
            throw new TimesheetValidationException("Le date di inizio e fine non possono essere nulle");
        }
        if (endDate.isBefore(startDate)) {
            throw new TimesheetValidationException("La data di fine non può essere precedente alla data di inizio");
        }
        if (absenceType == null || absenceType == AbsenceType.NONE) {
            throw new TimesheetValidationException("Assenza non valida");
        }

        List<TimesheetDay> createdDays = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            TimesheetDay day = TimesheetDay.builder()
                    .employee(employee)
                    .date(date)
                    .absenceType(absenceType)
                    .status(null)
                    .build();
            // setAbsence usa withTimesheetRules che aggiorna lo status
            createdDays.add(setAbsence(day, absenceType));
        }
        return Collections.unmodifiableList(createdDays);
    }

    // =========================
    // ITEMS OPERATIONS
    // =========================
    /**
     * Aggiunge (o somma) un item al timesheet day. Restituisce l'item
     * modificato/creato (ancora non persistito).
     */
    public TimesheetItem addItem(TimesheetDay day, TimesheetItemDTO dto) {
        validateDayAndDto(day, dto);
        return withTimesheetRules(day, d -> addItemAction(d, dto));
    }

    /**
     * Sostituisce / imposta un item (PUT semantics). Se l'item esiste per
     * commessa -> replace; altrimenti crea.
     */
    public TimesheetItem putItem(TimesheetDay day, TimesheetItemDTO dto) {
        validateDayAndDto(day, dto);
        return withTimesheetRules(day, d -> createItemAction(d, dto));
    }

    private TimesheetItem addItemAction(TimesheetDay day, TimesheetItemDTO dto) {
        // tenta di trovare item per commessa (se presente) e unisce ore se necessario
        TimesheetItem existingItem = findTimesheetItem(day, dto.getCommessaCode());
        if (existingItem != null) {
            return mergeItemAction(existingItem, dto);
        } else {
            return createItemAction(day, dto);
        }
    }

    private TimesheetItem createItemAction(TimesheetDay day, TimesheetItemDTO dto) {
        // mapDTOToEntity può lanciare ResourceNotFoundException se commessa non esiste
        TimesheetItem item = mapDTOToEntity(dto, day);
        day.addItem(item);
        return item;
    }

    private TimesheetItem mergeItemAction(TimesheetItem item, TimesheetItemDTO dto) {
        BigDecimal existing = safeHours(item.getHours());
        BigDecimal toAdd = safeHours(dto.getHours());
        BigDecimal newHours = existing.add(toAdd);
        item.setHours(newHours);
        return item;
    }

    private TimesheetItem findTimesheetItem(TimesheetDay day, String commessaCode) {
        if (commessaCode == null) {
            return null;
        }
        return day.getItems().stream()
                .filter(i -> i.getCommessa() != null && commessaCode.equals(i.getCommessa().getCode()))
                .findFirst()
                .orElse(null);
    }

    /**
     * Rimuove un item con id specifico; se non trovato lancia
     * ResourceNotFoundException.
     */
    public void deleteItem(TimesheetDay day, Long itemId) {
        if (day == null) {
            throw new TimesheetValidationException("Timesheet day non può essere null");
        }
        if (itemId == null) {
            throw new TimesheetValidationException("ItemId non può essere null");
        }

        withTimesheetRules(day, d -> {
            TimesheetItem item = d.getItems().stream()
                    .filter(i -> i.getId() != null && i.getId().equals(itemId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Item non trovato: " + itemId));
            d.removeItem(item);
            logger.debug("Item {} rimosso dal giorno {}", itemId, day.getDate());
            return null;
        });
    }

    // =========================
    // HELPERS
    // =========================
    /**
     * Aggiorna lo status del timesheet in base alle ore o assenza.
     */
    private void updateStatus(TimesheetDay day) {
        if (day == null) {
            return;
        }

        if (day.getAbsenceType() != null && day.getAbsenceType() != AbsenceType.NONE) {
            day.setStatus(null);
            return;
        }

        double totalHours = day.getItems().stream()
                .map(i -> safeHours(i.getHours()))
                .mapToDouble(BigDecimal::doubleValue)
                .sum();

        TimesheetStatus status;
        if (totalHours == 0.0) {
            status = TimesheetStatus.EMPTY;
        } else if (BigDecimal.valueOf(totalHours).compareTo(FULL_WORKDAY_HOURS) < 0) {
            status = TimesheetStatus.INCOMPLETE;
        } else {
            status = TimesheetStatus.COMPLETE;
        }

        day.setStatus(status);
        logger.debug("Timesheet {} status aggiornato a {}", day.getDate(), status);
    }

    /**
     * Map DTO -> Entity: risolve la commessa (o lancia
     * ResourceNotFoundException).
     */
    private TimesheetItem mapDTOToEntity(TimesheetItemDTO dto, TimesheetDay day) {
        validateItemDTO(dto);
        Commessa commessa = commessaRepository.findByCode(dto.getCommessaCode())
                .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata: " + dto.getCommessaCode()));
        return TimesheetItem.builder()
                .description(dto.getDescription())
                .hours(safeHours(dto.getHours()))
                .timesheetDay(day)
                .commessa(commessa)
                .build();
    }

    // =========================
    // Validation helpers
    // =========================
    private void validateDayAndDto(TimesheetDay day, TimesheetItemDTO dto) {
        if (day == null) {
            throw new TimesheetValidationException("TimesheetDay non può essere null");
        }
        if (dto == null) {
            throw new TimesheetValidationException("TimesheetItemDTO non può essere null");
        }
    }

    private void validateItemDTO(TimesheetItemDTO dto) {
        if (dto == null) {
            throw new TimesheetValidationException("Item DTO non può essere null");
        }
        if (dto.getCommessaCode() == null || dto.getCommessaCode().isBlank()) {
            throw new TimesheetValidationException("CommessaCode è obbligatorio");
        }
        if (dto.getHours() == null) {
            throw new TimesheetValidationException("Hours è obbligatorio");
        }
        if (dto.getHours().compareTo(ZERO) < 0) {
            throw new TimesheetValidationException("Hours non può essere negativo");
        }
    }

    private static BigDecimal safeHours(BigDecimal hours) {
        return hours == null ? ZERO : hours;
    }

    private static String safeCommessaCode(TimesheetItem item) {
        if (item == null || item.getCommessa() == null) {
            return "N/A";
        }
        return item.getCommessa().getCode();
    }
}
