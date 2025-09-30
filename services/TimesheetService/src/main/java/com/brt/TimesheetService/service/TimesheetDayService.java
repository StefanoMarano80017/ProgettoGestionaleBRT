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
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.repository.TimesheetDayRepository;
import com.brt.TimesheetService.repository.TimesheetItemRepository;

@Service
public class TimesheetDayService {

    private final TimesheetDayRepository timesheetDayRepository;
    private final TimesheetItemRepository timesheetItemRepository;
    private final EmployeeService employeeService;
    private final CommessaService commessaService;

    public TimesheetDayService(TimesheetDayRepository timesheetDayRepository,
                               TimesheetItemRepository timesheetItemRepository,
                               EmployeeService employeeService,
                               CommessaService commessaService) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.timesheetItemRepository = timesheetItemRepository;
        this.employeeService = employeeService;
        this.commessaService = commessaService;
    }

    // =====================================
    // GETTERS
    // =====================================

    public List<TimesheetDayDTO> getTimesheets(Long employeeId, YearMonth month) {
        Employee employee = getEmployeeOrThrow(employeeId);

        LocalDate start = (month != null) ? month.atDay(1) : LocalDate.of(2000, 1, 1);
        LocalDate end = (month != null) ? month.atEndOfMonth() : LocalDate.now();

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

    // =====================================
    // SAVE / UPDATE
    // =====================================

    @Transactional
    public TimesheetDayDTO saveTimesheet(Long employeeId, String dateStr, TimesheetDayDTO dto, boolean isAdmin, Employee currentUser) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);

        TimesheetDay day = timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .orElse(TimesheetDay.builder().employee(employee).date(date).build());

        day.setStatus(dto.getStatus());
        day.setAbsenceType(dto.getAbsenceType());

        validateRules(day, isAdmin, currentUser);

        clearAndAddItems(day, dto.getItems());

        TimesheetDay saved = timesheetDayRepository.save(day);
        return mapToDTO(saved);
    }

    // =====================================
    // ITEMS MANAGEMENT
    // =====================================

    @Transactional
    public TimesheetItemDTO addItem(Long employeeId, String dateStr, TimesheetItemDTO itemDTO) {
        TimesheetDay day = getOrCreateTimesheet(employeeId, dateStr);

        Commessa commessa = commessaService.getOrCreateCommessa(itemDTO.getCommessaCode());

        TimesheetItem item = TimesheetItem.builder()
                .description(itemDTO.getDescription())
                .hours(itemDTO.getHours())
                .timesheetDay(day)
                .commessa(commessa)
                .build();

        day.addItem(item);
        timesheetDayRepository.save(day);

        return itemDTO;
    }

    @Transactional
    public TimesheetItemDTO updateItem(Long employeeId, String dateStr, Long itemId, TimesheetItemDTO itemDTO) {
        verifyEmployeeAndTimesheet(employeeId, dateStr);

        int updated = timesheetItemRepository.updateItem(itemId, itemDTO.getDescription(), itemDTO.getHours());
        if (updated == 0) {
            throw new ResourceNotFoundException("Item non trovato: " + itemId);
        }

        return itemDTO;
    }

    @Transactional
    public void deleteItem(Long employeeId, String dateStr, Long itemId) {
        verifyEmployeeAndTimesheet(employeeId, dateStr);

        int deleted = timesheetItemRepository.deleteItemById(itemId);
        if (deleted == 0) {
            throw new ResourceNotFoundException("Item non trovato: " + itemId);
        }
    }

    // =====================================
    // DELETE TIMESHEET
    // =====================================

    @Transactional
    public void deleteTimesheet(Long employeeId, String dateStr) {
        Employee employee = getEmployeeOrThrow(employeeId);
        LocalDate date = parseDate(dateStr);

        timesheetDayRepository.findByEmployeeAndDate(employee, date)
                .ifPresent(timesheetDayRepository::delete);
    }

    // =====================================
    // UTILS / PRIVATE
    // =====================================

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

        if (!timesheetDayRepository.findByEmployeeAndDate(employee, date).isPresent()) {
            throw new ResourceNotFoundException("Timesheet non trovato per il giorno: " + date);
        }
    }

    private void clearAndAddItems(TimesheetDay day, List<TimesheetItemDTO> items) {
        day.getItems().clear();

        if (items != null) {
            items.stream()
                 .map(dto -> {
                     Commessa commessa = commessaService.getOrCreateCommessa(dto.getCommessaCode());
                     return TimesheetItem.builder()
                             .description(dto.getDescription())
                             .hours(dto.getHours())
                             .timesheetDay(day)
                             .commessa(commessa)
                             .build();
                 })
                 .forEach(day::addItem);
        }
    }

    private TimesheetDayDTO mapToDTO(TimesheetDay day) {
        List<TimesheetItemDTO> items = day.getItems().stream()
                .map(item -> TimesheetItemDTO.builder()
                        .id(item.getId())
                        .description(item.getDescription())
                        .hours(item.getHours())
                        .CommessaCode(item.getCommessa() != null ? item.getCommessa().getCode() : null)
                        .build())
                .collect(Collectors.toList());

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
            if (!day.getEmployee().getId().equals(currentUser.getId())) {
                throw new IllegalArgumentException("Un dipendente può modificare solo il proprio timesheet");
            }
        }

        if (day.getAbsenceType() != null && day.getAbsenceType() != day.getAbsenceType().NONE) {
            if (day.getStatus() != null) {
                throw new IllegalArgumentException("Se è presente un'assenza, lo status non può essere valorizzato");
            }
        } else {
            if (day.getStatus() == null) {
                throw new IllegalArgumentException("Se non è presente un'assenza, lo status deve essere valorizzato");
            }
        }
    }
}
