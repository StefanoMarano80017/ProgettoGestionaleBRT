package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetStatus;
import com.brt.TimesheetService.repository.TimesheetDayRepository;

@Service
public class TimesheetDayService {

    private static final Logger logger = LoggerFactory.getLogger(TimesheetDayService.class);

    private final TimesheetDayRepository timesheetDayRepository;
    private final EmployeeService employeeService;
    private final TimesheetItemService timesheetItemService;
    private final TimesheetValidator validator;

    public TimesheetDayService(TimesheetDayRepository timesheetDayRepository,
                               EmployeeService employeeService,
                               TimesheetItemService timesheetItemService,
                               TimesheetValidator validator) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.employeeService = employeeService;
        this.timesheetItemService = timesheetItemService;
        this.validator = validator;
    }

    // ===========================
    // GETTERS
    // ===========================
    public Page<TimesheetDayDTO> getTimesheets(Long employeeId, YearMonth month, String startDate, String endDate, Pageable pageable) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate start;
        LocalDate end;
        if (startDate != null && endDate != null) {
            start = LocalDate.parse(startDate);
            end = LocalDate.parse(endDate);
        } else if (month != null) {
            start = month.atDay(1);
            end = month.atEndOfMonth();
        } else {
            start = LocalDate.of(2000, 1, 1);
            end = LocalDate.now();
        }
        return timesheetDayRepository.findByEmployeeAndDateBetween(employee, start, end, pageable).map(this::mapToDTO);
    }

    public TimesheetDayDTO getTimesheet(Long employeeId, String dateStr) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);
        TimesheetDay day = timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date));
        return mapToDTO(day);
    }

    // ===========================
    // CREATE / MERGE TIMESHEET
    // ===========================
    @Transactional
    public TimesheetDayDTO createTimesheetEmployee(Long employeeId, String dateStr, TimesheetDayDTO dto) {
        return createOrMergeTimesheet(employeeId, dateStr, dto, false, false);
    }

    @Transactional
    public TimesheetDayDTO createTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto, boolean isAdmin) {
        return createOrMergeTimesheet(employeeId, dateStr, dto, isAdmin, false);
    }

    @Transactional
    public TimesheetDayDTO mergeTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto, boolean isAdmin) {
        return createOrMergeTimesheet(employeeId, dateStr, dto, isAdmin, true);
    }

    @Transactional
    public TimesheetDayDTO createOrMergeTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto, boolean isAdmin, boolean merge) {
        logger.info("createOrMergeTimesheet employeeId={}, date={}, merge={}", employeeId, dateStr, merge);
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);

        TimesheetDay day = merge
                ? timesheetDayRepository.findByEmployeeAndDate(employee, date)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Timesheet non esistente per employee=" + employeeId + " e data=" + date))
                : timesheetDayRepository.findByEmployeeAndDate(employee, date)
                        .orElse(TimesheetDay.builder().employee(employee).date(date).build());

        if (!merge && day.getId() != null) {
            throw new IllegalStateException("Timesheet già esistente per employee=" + employeeId + " e data=" + date);
        }

        // Applica absence dal DTO (se presente)
        day.setAbsenceType(dto.getAbsenceType());

        // Sostituisce / merge degli item (merge interne su stessa commessa)
        timesheetItemService.replaceItems(day, dto.getItems());

        // Aggiorna status/absence in modo coerente
        updateStatusAndAbsence(day);

        // Validazione finale delle regole (usa validator separato)
        validator.validateRules(day, isAdmin, employee);

        // Persist
        TimesheetDay saved = timesheetDayRepository.save(day);
        logger.info("Timesheet salvato id={}, employeeId={}, date={}, status={}, absence={}",
                        saved.getId(), saved.getEmployee() != null ? saved.getEmployee().getId() : null,
                        saved.getDate(), saved.getStatus(), saved.getAbsenceType());
        return mapToDTO(saved);
    }

    // ===========================
    // ITEM MANAGEMENT
    // ===========================
    @Transactional
    public TimesheetItemDTO addItem(Long employeeId, String dateStr, TimesheetItemDTO dto) {
        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);

        // addItem esegue merge se necessario
        timesheetItemService.addItem(day, dto);

        // ricalcola stato/absence
        updateStatusAndAbsence(day);

        // salva una sola volta e ritorna item aggiornato (per commessa)
        TimesheetDayDTO savedDto = mapToDTOAndSave(day);
        return savedDto.getItems().stream()
                .filter(i -> i.getCommessaCode() != null && i.getCommessaCode().equals(dto.getCommessaCode()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item non trovato dopo salvataggio per commessa: " + dto.getCommessaCode()));
    }

    @Transactional
    public TimesheetItemDTO updateItem(Long employeeId, String dateStr, Long itemId, TimesheetItemDTO dto) {
        verifyEmployeeAndTimesheet(employeeId, dateStr);

        timesheetItemService.updateItem(itemId, dto);

        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);
        updateStatusAndAbsence(day);

        return timesheetItemService.mapEntitiesToDTOs(day.getItems()).stream()
                .filter(i -> i.getId() != null && i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item non trovato dopo update id: " + itemId));
    }

    @Transactional
    public void deleteItem(Long employeeId, String dateStr, Long itemId) {
        verifyEmployeeAndTimesheet(employeeId, dateStr);

        // find the day first (to compute status after delete)
        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);

        timesheetItemService.deleteItem(itemId);

        updateStatusAndAbsence(day);
        mapToDTOAndSave(day); // salva lo stato aggiornato
    }

    // ===========================
    // DELETE TIMESHEET
    // ===========================
    @Transactional
    public void deleteTimesheet(Long employeeId, String dateStr) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);

        TimesheetDay day = timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date));

        timesheetDayRepository.delete(day);
        timesheetDayRepository.flush();
        logger.info("Timesheet eliminato employeeId={}, date={}", employeeId, date);
    }

    // ===========================
    // PRIVATE HELPERS
    // ===========================
    private Employee getEmployeeOrThrow(Long employeeId) {
        return employeeService.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato: " + employeeId));
    }

    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Formato data non valido: " + dateStr, e);
        }
    }

    private TimesheetDay getOrCreateTimesheet(Long employeeId, String dateStr) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);

        return timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElse(TimesheetDay.builder().employee(employee).date(date).build());
    }

    private void verifyEmployeeAndTimesheet(Long employeeId, String dateStr) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);
        if (timesheetDayRepository.findByEmployeeAndDate(employee, date).isEmpty()) {
            throw new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date);
        }
    }

    private TimesheetDayDTO mapToDTOAndSave(TimesheetDay day) {
        TimesheetDay saved = timesheetDayRepository.save(day);
        return mapToDTO(saved);
    }

    private TimesheetDayDTO mapToDTO(TimesheetDay day) {
        List<TimesheetItemDTO> items = timesheetItemService.mapEntitiesToDTOs(day.getItems());
        return TimesheetDayDTO.builder()
                .id(day.getId())
                .date(day.getDate())
                .status(day.getStatus())
                .absenceType(day.getAbsenceType())
                .items(items)
                .build();
    }

    /**
     * Aggiorna lo status e l'absence del day in maniera coerente:
     * - Se absence != NONE => status = null
     * - Altrimenti, calcola le ore totali e imposta status in {EMPTY, INCOMPLETE, COMPLETE}
     */
    private void updateStatusAndAbsence(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != com.brt.TimesheetService.model.AbsenceType.NONE) {
            // presenza di assenza -> status nullo (mutually exclusive)
            day.setStatus(null);
            logger.debug("updateStatusAndAbsence: presenza absence={}, imposto status=null per day id={}", day.getAbsenceType(), day.getId());
            return;
        }

        double totalHours = day.getItems().stream()
                .mapToDouble(i -> i.getHours() != null ? i.getHours().doubleValue() : 0.0)
                .sum();

        TimesheetStatus previous = day.getStatus();
        TimesheetStatus newStatus;
        if (totalHours == 0.0) {
            newStatus = TimesheetStatus.EMPTY;
        } else if (totalHours < 8.0) {
            newStatus = TimesheetStatus.INCOMPLETE;
        } else {
            newStatus = TimesheetStatus.COMPLETE;
        }
        day.setStatus(newStatus);
        logger.debug("updateStatusAndAbsence: day id={}, totalHours={}, status: {} -> {}", day.getId(), totalHours, previous, newStatus);
    }
}