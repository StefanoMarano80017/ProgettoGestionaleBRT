package com.brt.TimesheetService.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.repository.TimesheetItemRepository;

@Service
public class TimesheetItemService {

    private final TimesheetItemRepository timesheetItemRepository;

    public TimesheetItemService(TimesheetItemRepository timesheetItemRepository) {
        this.timesheetItemRepository = timesheetItemRepository;
    }

    public List<TimesheetItem> findByDay(TimesheetDay day) {
        return timesheetItemRepository.findByTimesheetDay(day);
    }

    public TimesheetItem save(TimesheetItem item) {
        return timesheetItemRepository.save(item);
    }

    public void delete(Long id) {
        timesheetItemRepository.deleteById(id);
    }
}
