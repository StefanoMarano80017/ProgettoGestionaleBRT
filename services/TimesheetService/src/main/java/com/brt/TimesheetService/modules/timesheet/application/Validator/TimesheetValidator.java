/*
 *   Copyright (c) 2025 Stefano Marano https://github.com/StefanoMarano80017
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
package com.brt.TimesheetService.modules.timesheet.application.validator;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.brt.TimesheetService.modules.timesheet.domain.TimesheetDay;
import com.brt.TimesheetService.modules.user.domain.Employee;

@Component
public class TimesheetValidator {

    private final Map<OperationContext, List<TimesheetValidationRule>> rulesByContext;

    public TimesheetValidator(
            AbsenceConsistencyRule absenceConsistencyRule,
            CurrentMonthRule currentMonthRule,
            FutureDateRule futureDateRule,
            OwnershipRule ownershipRule
    ) {
        // Iniezione delle regole e mappatura per contesto
        this.rulesByContext = Map.of(
                OperationContext.USER, List.of(
                        absenceConsistencyRule, // Se setto l'assenza, non ci devono essere ore lavorate
                        currentMonthRule, // Non posso modificare mesi diversi da quello corrente
                        futureDateRule, // Non posso modificare giorni futuri
                        ownershipRule // Posso modificare solo i miei timesheet
                ),
                OperationContext.ADMIN, List.of(
                        absenceConsistencyRule, // Se setto l'assenza, non ci devono essere ore lavorate
                        futureDateRule // Non posso modificare giorni futuri
                ),
                OperationContext.ADMIN_SET_ABSENCE, List.of(
                        absenceConsistencyRule // Se setto l'assenza, non ci devono essere ore lavorate
                )
        );
    }

    public void validateRules(TimesheetDay day, OperationContext context, Employee currentUser) {
        List<TimesheetValidationRule> rules = rulesByContext.get(context);
        if (rules == null) {
            throw new IllegalArgumentException("Unknown operation context: " + context);
        }
        rules.forEach(r -> r.validate(day, currentUser));
    }

    /**
     * Metodo di utilità per interpretare i parametri di filtro delle date.
     * Restituisce un array di due LocalDate: [startDate, endDate].
     *
     * Logica: - Se start ed end sono forniti, li usa direttamente. - Se solo
     * uno dei due è fornito, completa l'altro in modo coerente: → start = dato,
     * end = oggi (se end mancante) → start = inizio mese corrente (se start
     * mancante) - Se nessuno è fornito, usa il mese corrente come intervallo.
     */
    public LocalDate[] parseDateRange(LocalDate start, LocalDate end) {
        LocalDate rangeStart;
        LocalDate rangeEnd;

        if (start != null && end != null) {
            rangeStart = start;
            rangeEnd = end;
        } else if (start != null) {
            rangeStart = start;
            rangeEnd = LocalDate.now();
        } else if (end != null) {
            YearMonth currentMonth = YearMonth.now();
            rangeStart = currentMonth.atDay(1);
            rangeEnd = end;
        } else {
            YearMonth currentMonth = YearMonth.now();
            rangeStart = currentMonth.atDay(1);
            rangeEnd = currentMonth.atEndOfMonth();
        }

        return new LocalDate[]{rangeStart, rangeEnd};
    }
}
