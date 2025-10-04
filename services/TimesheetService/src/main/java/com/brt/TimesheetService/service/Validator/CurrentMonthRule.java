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

import java.time.YearMonth;

import org.springframework.stereotype.Component;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.Employee; 
import com.brt.TimesheetService.exception.TimesheetValidationException;

@Component
public class CurrentMonthRule implements TimesheetValidationRule {
    @Override
    public void validate(TimesheetDay day, Employee currentUser) {
        YearMonth now = YearMonth.now();
        if (!YearMonth.from(day.getDate()).equals(now)) {
            throw new TimesheetValidationException("Il dipendente può modificare solo i giorni del mese corrente");
        }
    }
}
