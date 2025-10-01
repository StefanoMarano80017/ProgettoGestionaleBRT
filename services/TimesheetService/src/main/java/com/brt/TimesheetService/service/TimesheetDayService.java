package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.dto.TimesheetItemDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.repository.TimesheetDayRepository;

@Service
public class TimesheetDayService {

    private final TimesheetDayRepository timesheetDayRepository;
    private final EmployeeService employeeService;
    private final TimesheetItemService timesheetItemService;

    public TimesheetDayService(TimesheetDayRepository timesheetDayRepository,
                               EmployeeService employeeService,
                               TimesheetItemService timesheetItemService) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.employeeService = employeeService;
        this.timesheetItemService = timesheetItemService;
    }

    // ===========================
    // GETTERS
    // ===========================

    public List<TimesheetDayDTO> getTimesheets(Long employeeId, YearMonth month) {
        Employee employee = getEmployeeOrThrow(employeeId);

        LocalDate start = month != null ? month.atDay(1) : LocalDate.of(2000, 1, 1);
        LocalDate end = month != null ? month.atEndOfMonth() : LocalDate.now();

        return timesheetDayRepository.findByEmployeeAndDateBetween(employee, start, end)
                                     .stream()
                                     .map(this::mapToDTO)
                                     .collect(Collectors.toList());
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

    public TimesheetDayDTO createTimesheetEmployee(Long employeeId, String dateStr, TimesheetDayDTO dto) {
        return createOrMergeTimesheet(employeeId, dateStr, dto, false, null, false);
    }

    @Transactional
    public TimesheetDayDTO createTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto, boolean isAdmin, Employee currentUser) {
        return createOrMergeTimesheet(employeeId, dateStr, dto, isAdmin, currentUser, false);
    }

    @Transactional
    public TimesheetDayDTO mergeTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto, boolean isAdmin, Employee currentUser) {
        return createOrMergeTimesheet(employeeId, dateStr, dto, isAdmin, currentUser, true);
    }

    @Transactional
    public TimesheetDayDTO createOrMergeTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto,
                                                boolean isAdmin, Employee currentUser, boolean merge) {
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

        // Imposta absence dal DTO
        day.setAbsenceType(dto.getAbsenceType());

        // Gestisce gli item tramite il service
        timesheetItemService.replaceItems(day, dto.getItems());

        // Aggiorna lo stato automaticamente in base agli item e assenza
        updateStatusAndAbsence(day);

        TimesheetDay saved = timesheetDayRepository.save(day);
        return mapToDTO(saved);
    }


    // ===========================
    // ITEM MANAGEMENT
    // ===========================

    @Transactional
    public TimesheetItemDTO addItem(Long employeeId, String dateStr, TimesheetItemDTO itemDTO) {
        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);
        timesheetItemService.addItem(day, itemDTO);
        updateStatusAndAbsence(day);
        timesheetDayRepository.save(day);
        return timesheetItemService.mapEntityToDTO(day.getItems().get(day.getItems().size() - 1));
    }

    @Transactional
    public TimesheetItemDTO updateItem(Long employeeId, String dateStr, Long itemId, TimesheetItemDTO itemDTO) {
        verifyEmployeeAndTimesheet(employeeId, dateStr);
        timesheetItemService.updateItem(itemId, itemDTO);
        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);
        updateStatusAndAbsence(day);
        timesheetDayRepository.save(day);
        return timesheetItemService.mapEntityToDTO(timesheetItemService.findById(itemId));
    }

    @Transactional
    public void deleteItem(Long employeeId, String dateStr, Long itemId) {
        verifyEmployeeAndTimesheet(employeeId, dateStr);
        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);
        timesheetItemService.deleteItem(itemId);
        updateStatusAndAbsence(day);
        timesheetDayRepository.save(day);
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
    }

    // ===========================
    // PRIVATE UTILS
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
        return timesheetDayRepository.findByEmployeeAndDate(employee, date).orElse(TimesheetDay.builder().employee(employee).date(date).build());
    }

    private void verifyEmployeeAndTimesheet(Long employeeId, String dateStr) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);
        if (timesheetDayRepository.findByEmployeeAndDate(employee, date).isEmpty()) {
            throw new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date);
        }
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

    private void validateRules(TimesheetDay day, boolean isAdmin, Employee currentUser) {
        LocalDate today = LocalDate.now();

        if (day.getDate().isAfter(today)) {
            throw new IllegalArgumentException("Non è possibile inserire o modificare giorni futuri");
        }

        if (!isAdmin) {
            YearMonth now = YearMonth.from(today);
            YearMonth target = YearMonth.from(day.getDate());
            if (!now.equals(target)) {
                throw new IllegalArgumentException("Il dipendente può modificare solo i giorni del mese corrente");
            }
            if (currentUser == null || !day.getEmployee().getId().equals(currentUser.getId())) {
                throw new IllegalArgumentException("Un dipendente può modificare solo il proprio timesheet");
            }
        }

        if (day.getAbsenceType() != null && day.getAbsenceType() != com.brt.TimesheetService.model.AbsenceType.NONE) {
            if (day.getStatus() != null) {
                throw new IllegalArgumentException("Se è presente un'assenza, lo status non può essere valorizzato");
            }
        } else {
            if (day.getStatus() == null) {
                throw new IllegalArgumentException("Se non è presente un'assenza, lo status deve essere valorizzato");
            }
        }
    }

    private void updateStatusAndAbsence(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != com.brt.TimesheetService.model.AbsenceType.NONE) {
            // C'è assenza → status nullo
            day.setStatus(null);
        } else {
            // Calcola lo stato basato sulle ore totali
            double totalHours = day.getItems().stream()
                                   .mapToDouble(i -> i.getHours() != null ? i.getHours().doubleValue() : 0.0)
                                   .sum();

            if (totalHours == 0) {
                day.setStatus(com.brt.TimesheetService.model.TimesheetStatus.EMPTY);
            } else if (totalHours < 8) {
                day.setStatus(com.brt.TimesheetService.model.TimesheetStatus.INCOMPLETE);
            } else {
                day.setStatus(com.brt.TimesheetService.model.TimesheetStatus.COMPLETE);
            }
        }
    }

}
