package com.brt.TimesheetService.exception;

public class TimesheetValidationException extends RuntimeException {
    public TimesheetValidationException(String message) {
        super(message);
    }

    public TimesheetValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
