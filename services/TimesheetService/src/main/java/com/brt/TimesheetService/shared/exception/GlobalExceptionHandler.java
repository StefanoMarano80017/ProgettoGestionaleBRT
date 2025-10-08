package com.brt.TimesheetService.shared.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Gestore globale delle eccezioni. Fornisce risposte strutturate e logging
 * dettagliato per tutte le eccezioni applicative.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ==========================
    // MODELLO DI RISPOSTA
    // ==========================
    private record ErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            String message,
            String path
            ) {

        static ErrorResponse of(HttpStatus status, String message, String path) {
            return new ErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, path);
        }
    }

    // ==========================
    // HANDLER SPECIFICI
    // ==========================
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        logger.warn("Risorsa non trovata: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        logger.warn("Argomento non valido: {}", ex.getMessage());
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        logger.warn("Errore di validazione: {}", ex.getMessage());

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");
        response.put("message", "Dati non validi");
        response.put("details", fieldErrors);
        response.put("path", request.getRequestURI());

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        logger.error("Stato non valido: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI()));
    }

    /**
     * Handler specifico per eccezioni sollevate durante l'elaborazione dei
     * report. Le ReportProcessingException vengono loggate come errori e
     * mappate su 500.
     */
    @ExceptionHandler(ReportProcessingException.class)
    public ResponseEntity<ErrorResponse> handleReportProcessing(ReportProcessingException ex, HttpServletRequest request) {
        logger.error("Errore durante l'elaborazione del report: {}", ex.getMessage(), ex);
        // puoi cambiare lo Status in 503 se preferisci indicare un errore temporaneo (service unavailable)
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR, "Errore durante l'elaborazione del report", request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        logger.error("Errore interno del server: ", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno del server", request.getRequestURI()));
    }
}
