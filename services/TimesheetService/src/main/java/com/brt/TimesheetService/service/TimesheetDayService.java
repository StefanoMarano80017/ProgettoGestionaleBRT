package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
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
import com.brt.TimesheetService.model.AbsenceType;
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

    public TimesheetDayDTO getTimesheet(Long employeeId, LocalDate date) {
        Employee employee = getEmployeeOrThrow(employeeId);
        TimesheetDay day = timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date));
        return mapToDTO(day);
    }

    // ===========================
    // CREATE / MERGE TIMESHEET
    // ===========================
    @Transactional
    public TimesheetDayDTO createTimesheetEmployee(Long employeeId, LocalDate Date, TimesheetDayDTO dto) {
        return createOrMergeTimesheet(employeeId, Date, dto, false, false);
    }

    @Transactional
    public TimesheetDayDTO createTimesheet(Long employeeId, LocalDate Date, TimesheetDayDTO dto, boolean isAdmin) {
        return createOrMergeTimesheet(employeeId, Date, dto, isAdmin, false);
    }

    @Transactional
    public TimesheetDayDTO mergeTimesheet(Long employeeId, LocalDate Date, TimesheetDayDTO dto, boolean isAdmin) {
        return createOrMergeTimesheet(employeeId, Date, dto, isAdmin, true);
    }

    @Transactional
    public TimesheetDayDTO createOrMergeTimesheet(Long employeeId, LocalDate date, TimesheetDayDTO dto, boolean isAdmin, boolean merge) {
        logger.info("createOrMergeTimesheet employeeId={}, date={}, merge={}", employeeId, date, merge);
        Employee employee = getEmployeeOrThrow(employeeId);

        TimesheetDay day = merge ? timesheetDayRepository.findByEmployeeAndDate(employee, date).orElseThrow(
                    () -> new ResourceNotFoundException("Timesheet non esistente per employee=" + employeeId + " e data=" + date))
                : timesheetDayRepository.findByEmployeeAndDate(employee, date)
                        .orElse(TimesheetDay.builder().employee(employee).date(date).build());

        if (!merge && day.getId() != null) {
            throw new IllegalStateException("Timesheet già esistente per employee=" + employeeId + " e data=" + date);
        }

        // Applica absence dal DTO (se presente)
        day.setAbsenceType(dto.getAbsenceTypeEnum());
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

    public TimesheetDayDTO createAbsenceTimesheet(Long employeeId, LocalDate date, AbsenceType absenceType, boolean isAdmin) {
        Employee employee = getEmployeeOrThrow(employeeId);
        if (timesheetDayRepository.existsByEmployeeAndDate(employee, date)) {
            throw new IllegalStateException("TimesheetDay già esistente per " + employee + " alla data " + date);
        }
        TimesheetDay newDay = TimesheetDay.builder().employee(employee).date(date).absenceType(absenceType).status(null).build();
        // Validazione finale delle regole (usa validator separato)
        validator.validateRulesForAdminNoFutureCheck(newDay);
        TimesheetDay saved = timesheetDayRepository.save(newDay);
        logger.info("Timesheet di assenza creato id={}, employeeId={}, date={}, absence={}",
                saved.getId(), saved.getEmployee() != null ? saved.getEmployee().getId() : null,
                saved.getDate(), saved.getAbsenceType());
        return mapToDTO(saved);
    }

    public List<TimesheetDayDTO> createAbsenceTimesheets(Long employeeId, LocalDate startDate, LocalDate endDate, AbsenceType absenceType, boolean isAdmin) {
        Employee employee   = getEmployeeOrThrow(employeeId);
        if(startDate == null || endDate == null) {
            throw new IllegalArgumentException("Le date di inizio e fine non possono essere nulle");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("La data di fine non può essere precedente alla data di inizio");
        }

        List<TimesheetDayDTO> createdDays = new ArrayList<>();

        // Ciclo su tutte le date nell'intervallo
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            // Controllo se esiste già
            if (timesheetDayRepository.existsByEmployeeAndDate(employee, date)) {
                logger.warn("TimesheetDay già esistente per employeeId={} alla data {}, salto creazione", employee.getId(), date);
                throw new IllegalStateException("TimesheetDay già esistente per " + employee + " alla data " + date);
            }
            TimesheetDay newDay = TimesheetDay.builder().employee(employee).date(date).absenceType(absenceType).status(null).build();
            // Validazione
            validator.validateRulesForAdminNoFutureCheck(newDay);
            // Salvataggio
            TimesheetDay saved = timesheetDayRepository.save(newDay);
            logger.info("Timesheet di assenza creato id={}, employeeId={}, date={}, absence={}", 
                            saved.getId(), saved.getEmployee() != null ? saved.getEmployee().getId() : null, saved.getDate(), saved.getAbsenceType());
            createdDays.add(mapToDTO(saved));
        }

        return createdDays;
    }

    // ===========================
    // ITEM MANAGEMENT
    // ===========================
    @Transactional
    public TimesheetItemDTO addItem(Long employeeId, LocalDate date, TimesheetItemDTO dto) {
        TimesheetDay day = getOrCreateTimesheet(employeeId, date);

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
    public TimesheetItemDTO updateItem(Long employeeId, LocalDate date, Long itemId, TimesheetItemDTO dto) {
        verifyEmployeeAndTimesheet(employeeId, date);

        timesheetItemService.updateItem(itemId, dto);

        TimesheetDay day = getOrCreateTimesheet(employeeId, date);
        updateStatusAndAbsence(day);

        return timesheetItemService.mapEntitiesToDTOs(day.getItems()).stream()
                .filter(i -> i.getId() != null && i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item non trovato dopo update id: " + itemId));
    }

    @Transactional
    public void deleteItem(Long employeeId, LocalDate Date, Long itemId) {
        verifyEmployeeAndTimesheet(employeeId, Date);
        // find the day first (to compute status after delete)
        TimesheetDay day = getOrCreateTimesheet(employeeId, Date);
        timesheetItemService.deleteItem(itemId);
        updateStatusAndAbsence(day);
        mapToDTOAndSave(day); // salva lo stato aggiornato
    }

    // ===========================
    // DELETE TIMESHEET
    // ===========================
    @Transactional
    public void deleteTimesheet(Long employeeId, LocalDate Date) {
        Employee employee = getEmployeeOrThrow(employeeId);
        TimesheetDay day = timesheetDayRepository.findByEmployeeAndDate(employee, Date)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet non trovato per il giorno: " + Date));
        timesheetDayRepository.delete(day);
        timesheetDayRepository.flush();
        logger.info("Timesheet eliminato employeeId={}, date={}", employeeId, Date);
    }

    // ===========================
    // PRIVATE HELPERS
    // ===========================
    private Employee getEmployeeOrThrow(Long employeeId) {
        return employeeService.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Dipendente non trovato: " + employeeId));
    }

    private TimesheetDay getOrCreateTimesheet(Long employeeId, LocalDate Date) {
        Employee employee = getEmployeeOrThrow(employeeId);
        return timesheetDayRepository.findByEmployeeAndDate(employee, Date)
                .orElse(TimesheetDay.builder().employee(employee).date(Date).build());
    }

    private void verifyEmployeeAndTimesheet(Long employeeId, LocalDate Date) {
        Employee employee = getEmployeeOrThrow(employeeId);
        if (timesheetDayRepository.findByEmployeeAndDate(employee, Date).isEmpty()) {
            throw new ResourceNotFoundException("Timesheet non trovato per il giorno: " + Date);
        }
    }

    private TimesheetDayDTO mapToDTOAndSave(TimesheetDay day) {
        TimesheetDay saved = timesheetDayRepository.save(day);
        return mapToDTO(saved);
    }

    private TimesheetDayDTO mapToDTO(TimesheetDay day) {
        List<TimesheetItemDTO> items = timesheetItemService.mapEntitiesToDTOs(day.getItems());
        return TimesheetDayDTO.builder().id(day.getId()).date(day.getDate()).status(day.getStatus())
                .absenceTypeStr(day.getAbsenceType() != null ? day.getAbsenceType().name() : null)
                .items(items).build();
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