package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.time.YearMonth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.TimesheetDayDTO;
import com.brt.TimesheetService.model.AbsenceType;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetStatus;
import com.brt.TimesheetService.repository.TimesheetDayRepository;
import com.brt.TimesheetService.util.TimesheetUtils;

@Service
@Transactional
public class TimesheetDayService {

    private static final Logger logger = LoggerFactory.getLogger(TimesheetDayService.class);

    private final TimesheetDayRepository timesheetDayRepository;
    private final TimesheetItemService timesheetItemService;
    private final TimesheetUtils timesheetUtils;
    private final TimesheetValidator validator;

    public TimesheetDayService(TimesheetDayRepository timesheetDayRepository,
                               TimesheetUtils timesheetUtils,
                               TimesheetItemService timesheetItemService,
                               TimesheetValidator validator) {
        this.timesheetDayRepository = timesheetDayRepository;
        this.timesheetUtils = timesheetUtils;
        this.timesheetItemService = timesheetItemService;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public Page<TimesheetDayDTO> getTimesheets(Long employeeId,
                                               YearMonth month,
                                               LocalDate startDate,
                                               LocalDate endDate,
                                               Pageable pageable) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        LocalDate[] range = validator.parseDateRange(month, startDate, endDate);
        return timesheetDayRepository.findByEmployeeAndDateBetween(employee, range[0], range[1], pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public TimesheetDayDTO getTimesheet(Long employeeId, LocalDate date) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        TimesheetDay day  = timesheetUtils.findTimesheetOrThrow(employee, date);
        return mapToDTO(day);
    }

    public TimesheetDayDTO createTimesheetEmployee(Long employeeId, LocalDate date, TimesheetDayDTO dto) {
        return createOrMergeTimesheet(employeeId, date, dto, false, false);
    }

    public TimesheetDayDTO createTimesheet(Long employeeId, LocalDate date, TimesheetDayDTO dto, boolean isAdmin) {
        return createOrMergeTimesheet(employeeId, date, dto, isAdmin, false);
    }

    public TimesheetDayDTO mergeTimesheet(Long employeeId, LocalDate date, TimesheetDayDTO dto, boolean isAdmin) {
        return createOrMergeTimesheet(employeeId, date, dto, isAdmin, true);
    }

    private TimesheetDayDTO createOrMergeTimesheet(Long employeeId,
                                                   LocalDate date,
                                                   TimesheetDayDTO dto,
                                                   boolean isAdmin,
                                                   boolean merge) {
        logger.debug("createOrMergeTimesheet employeeId={}, date={}, merge={}", employeeId, date, merge);
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        TimesheetDay day;
        if (merge) {
            day = timesheetUtils.findTimesheetOrThrow(employee, date);
        } else {
            day = timesheetDayRepository.findByEmployeeAndDate(employee, date).orElse(TimesheetDay.builder().employee(employee).date(date).build());
        }
        if (!merge && day.getId() != null) {
            throw new IllegalStateException("Timesheet già esistente per employee=" + employeeId + " e data=" + date);
        }
        applyDtoToTimesheet(day, dto, isAdmin);
        return mapToDTOAndSave(day);
    }

    public TimesheetDayDTO createAbsenceTimesheet(Long employeeId, LocalDate date, AbsenceType absenceType) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        return setAbsenceItem(employee, date, absenceType);
    }

    public java.util.List<TimesheetDayDTO> createAbsenceTimesheets(Long employeeId,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate,
                                                                    AbsenceType absenceType) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        validator.validateDateRange(startDate, endDate);
        java.util.List<TimesheetDayDTO> createdDays = new java.util.ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            createdDays.add(setAbsenceItem(employee, date, absenceType));
        }
        return createdDays;
    }

    public TimesheetDayDTO setAbsenceItem(Employee employee, LocalDate date, AbsenceType absenceType) {
        ensureTimesheetNotExists(employee, date);
        TimesheetDay day = TimesheetDay.builder()
                .employee(employee)
                .date(date)
                .absenceType(absenceType)
                .status(null)
                .build();
        return mapToDTOAndSave(day);
    }

    public void deleteTimesheet(Long employeeId, LocalDate date) {
        Employee employee = timesheetUtils.getEmployeeOrThrow(employeeId);
        TimesheetDay day = timesheetUtils.findTimesheetOrThrow(employee, date);
        timesheetDayRepository.delete(day);
        timesheetDayRepository.flush();
        logger.info("Timesheet eliminato employeeId={}, date={}", employeeId, date);
    }

    // ——— PRIVATE HELPERS ———
    private void applyDtoToTimesheet(TimesheetDay day, TimesheetDayDTO dto, boolean isAdmin) {
        day.setAbsenceType(dto.getAbsenceTypeEnum());
        timesheetItemService.replaceItems(day, dto.getItems());
        updateStatusAndAbsence(day);
        validator.validateRules(day, isAdmin, day.getEmployee());
    }

    private void updateStatusAndAbsence(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != AbsenceType.NONE) {
            day.setStatus(null);
        } else {
            double totalHours = day.getItems().stream()
                    .mapToDouble(i -> i.getHours() != null ? i.getHours().doubleValue() : 0.0)
                    .sum();
            TimesheetStatus newStatus;
            if (totalHours == 0.0) {
                newStatus = TimesheetStatus.EMPTY;
            } else if (totalHours < FULL_WORKDAY_HOURS) {
                newStatus = TimesheetStatus.INCOMPLETE;
            } else {
                newStatus = TimesheetStatus.COMPLETE;
            }
            day.setStatus(newStatus);
        }
        logger.debug("updateStatusAndAbsence: day id={}, absence={}, status={}",
                day.getId(), day.getAbsenceType(), day.getStatus());
    }

    private TimesheetDayDTO mapToDTO(TimesheetDay day) {
        var itemsDto = TimesheetUtils.mapEntitiesToDTOs(day.getItems());
        return TimesheetDayDTO.builder()
                .id(day.getId())
                .date(day.getDate())
                .status(day.getStatus())
                .absenceTypeStr(day.getAbsenceType() != null ? day.getAbsenceType().name() : null)
                .items(itemsDto)
                .build();
    }

    private TimesheetDayDTO mapToDTOAndSave(TimesheetDay day) {
        TimesheetDay saved = saveAndLog(day, "Timesheet salvato in mapToDTOAndSave");
        return mapToDTO(saved);
    }

    private TimesheetDay saveAndLog(TimesheetDay day, String message) {
        TimesheetDay saved = timesheetDayRepository.save(day);
        logger.info("{} id={}, employeeId={}, date={}, status={}, absence={}",
                message, saved.getId(), saved.getEmployee().getId(),
                saved.getDate(), saved.getStatus(), saved.getAbsenceType());
        return saved;
    }

    private void ensureTimesheetNotExists(Employee employee, LocalDate date) {
        if (timesheetDayRepository.existsByEmployeeAndDate(employee, date)) {
            throw new IllegalStateException("TimesheetDay già esistente per " + employee.getId()
                    + " alla data " + date);
        }
    }
}