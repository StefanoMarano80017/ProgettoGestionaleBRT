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
     * Metodo principale: valida tutte le regole, distinguendo admin da utente normale
     */
    public void validateRules(TimesheetDay day, boolean isAdmin, Employee currentUser) {
        validateFutureDate(day);
        if (!isAdmin) {
            validateCurrentMonth(day);
            validateOwnership(day, currentUser);
        }
        validateAbsenceStatusConsistency(day);
    }

    /**
     * Metodo dedicato solo all'admin: ignora controlli su ownership e mese corrente
     */
    public void validateRulesForAdmin(TimesheetDay day) {
        validateFutureDate(day);
        validateAbsenceStatusConsistency(day);
    }

    public void validateRulesForAdminNoFutureCheck(TimesheetDay day) {
        validateAbsenceStatusConsistency(day);
    }

    // =======================
    // CONTROLLI PRIVATI
    // =======================

    private void validateFutureDate(TimesheetDay day) {
        LocalDate today = LocalDate.now();
        if (day.getDate().isAfter(today)) {
            throw new TimesheetValidationException("Non è possibile inserire o modificare giorni futuri");
        }
    }

    private void validateCurrentMonth(TimesheetDay day) {
        LocalDate today = LocalDate.now();
        YearMonth now = YearMonth.from(today);
        YearMonth target = YearMonth.from(day.getDate());
        if (!now.equals(target)) {
            throw new TimesheetValidationException("Il dipendente può modificare solo i giorni del mese corrente");
        }
    }

    private void validateOwnership(TimesheetDay day, Employee currentUser) {
        if (currentUser == null || day.getEmployee() == null || !day.getEmployee().getId().equals(currentUser.getId())) {
            throw new TimesheetValidationException("Un dipendente può modificare solo il proprio timesheet");
        }
    }

    private void validateAbsenceStatusConsistency(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != com.brt.TimesheetService.model.AbsenceType.NONE) {
            if (day.getStatus() != null) {
                throw new TimesheetValidationException("Se è presente un'assenza, lo status non può essere valorizzato");
            }
        }
    }
}
