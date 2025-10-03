package com.brt.TimesheetService.service;

import java.time.LocalDate;
import java.time.YearMonth;

import org.springframework.stereotype.Component;

import com.brt.TimesheetService.exception.TimesheetValidationException;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;

@Component
public class TimesheetValidator {
    // =======================
    // PUBLIC METHODS
    /**
     * Metodo di utilità per interpretare i parametri di filtro delle date.
     * Restituisce un array di due LocalDate: [startDate, endDate].
     * La logica è:
     * - Se start ed end sono forniti, li usa direttamente.
     * - Altrimenti, se month è fornito, calcola il primo e l'ultimo giorno del mese.
     * - Se nessuno è fornito, usa un intervallo ampio (es. dal 2000-01-01 ad oggi).
     */
    public LocalDate[] parseDateRange(YearMonth month, LocalDate start, LocalDate end) {
        LocalDate rangeStart;
        LocalDate rangeEnd;

        if (start != null && end != null) {
            rangeStart = start;
            rangeEnd = end;
        } else if (month != null) {
            rangeStart = month.atDay(1);
            rangeEnd = month.atEndOfMonth();
        } else {
            rangeStart = LocalDate.of(2000, 1, 1);
            rangeEnd = LocalDate.now();
        }

        return new LocalDate[]{rangeStart, rangeEnd};
    }

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

    /**
     * Metodo admin che ignora anche il controllo sulle date future
     */
    public void validateAbsenceStatusConsistency(TimesheetDay day) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != com.brt.TimesheetService.model.AbsenceType.NONE) {
            if (day.getStatus() != null) {
                throw new TimesheetValidationException("Se è presente un'assenza, lo status non può essere valorizzato");
            }
        }
    }
    /**
     * Validazione intervallo date (start <= end)
     */
    public void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new TimesheetValidationException("Le date di inizio e fine non possono essere nulle");
        }
        if (endDate.isBefore(startDate)) {
            throw new TimesheetValidationException("La data di fine non può essere precedente alla data di inizio");
        }
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

}
