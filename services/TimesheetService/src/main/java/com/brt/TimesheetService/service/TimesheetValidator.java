package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.time.YearMonth;

import org.springframework.stereotype.Component;

import com.brt.TimesheetService.exception.TimesheetValidationException;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;

@Component
public class TimesheetValidator {

    /**
     * Valida regole di business sul timesheet (giorno futuro, ownership, mese corrente,
     * incoerenze status/absence).
     * Non valida lo stato/absence in maniera completa (questo è calcolato da TimesheetDayService).
     */
    public void validateRules(TimesheetDay day, boolean isAdmin, Employee currentUser) {
        LocalDate today = LocalDate.now();

        if (day.getDate().isAfter(today)) {
            throw new TimesheetValidationException("Non è possibile inserire o modificare giorni futuri");
        }

        if (!isAdmin) {
            YearMonth now = YearMonth.from(today);
            YearMonth target = YearMonth.from(day.getDate());
            if (!now.equals(target)) {
                throw new TimesheetValidationException("Il dipendente può modificare solo i giorni del mese corrente");
            }
            if (currentUser == null || day.getEmployee() == null || !day.getEmployee().getId().equals(currentUser.getId())) {
                throw new TimesheetValidationException("Un dipendente può modificare solo il proprio timesheet");
            }
        }

        // Se è presente un'assenza diversa da NONE non è consentito avere uno status valorizzato.
        if (day.getAbsenceType() != null && day.getAbsenceType() != com.brt.TimesheetService.model.AbsenceType.NONE) {
            if (day.getStatus() != null) {
                throw new TimesheetValidationException("Se è presente un'assenza, lo status non può essere valorizzato");
            }
        }
    }
}
