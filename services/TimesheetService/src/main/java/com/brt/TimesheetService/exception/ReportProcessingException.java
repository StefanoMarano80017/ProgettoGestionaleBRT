package com.brt.TimesheetService.exception;

// =============================================================
// Eccezione specifica per errori nei report
// =============================================================
public class ReportProcessingException extends RuntimeException {
    public ReportProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}