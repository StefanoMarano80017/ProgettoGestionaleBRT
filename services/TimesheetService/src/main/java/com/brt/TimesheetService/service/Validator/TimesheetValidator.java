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

package com.brt.TimesheetService.service.Validator;

import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.model.TimesheetDay;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class TimesheetValidator {

    public enum OperationContext {
        ADMIN,
        ADMIN_SET_ABSENCE,
        USER
    }

    private final Map<OperationContext, List<TimesheetValidationRule>> rulesByContext;
    
    public TimesheetValidator(
            AbsenceConsistencyRule absenceConsistencyRule,
            CurrentMonthRule currentMonthRule,
            FutureDateRule futureDateRule,
            ownershipRule ownershipRule,
    ) {
        // Iniezione delle regole e mappatura per contesto
        this.rulesByContext = Map.of(
                OperationContext.ADMIN, List.of(
                        ruleNoItemsWithAbsence,
                        ruleMaxHoursPerDay
                ),
                OperationContext.USER, List.of(
                        ruleNoItemsWithAbsence,
                        ruleMaxHoursPerDay,
                        ruleNoModificationsIfApproved
                ),
                OperationContext.ADMIN_SET_ABSENCE, List.of(
                        ruleNoItemsWithAbsence
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
}