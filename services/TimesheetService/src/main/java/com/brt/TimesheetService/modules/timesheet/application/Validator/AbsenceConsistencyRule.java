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

import org.springframework.stereotype.Component;

import com.brt.TimesheetService.modules.timesheet.domain.AbsenceType;
import com.brt.TimesheetService.modules.timesheet.domain.TimesheetDay;
import com.brt.TimesheetService.modules.user.domain.Employee;
import com.brt.TimesheetService.shared.exception.TimesheetValidationException;

@Component
public class AbsenceConsistencyRule implements TimesheetValidationRule {

    @Override
    public void validate(TimesheetDay day, Employee currentUser) {
        if (day.getAbsenceType() != null && day.getAbsenceType() != AbsenceType.NONE
                && day.getStatus() != null) {
            throw new TimesheetValidationException("Se è presente un'assenza, lo status non può essere valorizzato");
        }
    }
}
