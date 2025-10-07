package com.brt.TimesheetService.service;

import java.util.List;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.exception.EmployeeServiceException;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Employee;
import com.brt.TimesheetService.repository.EmployeeRepository;

/**
 * Servizio per la gestione degli Employee con logging, validazioni, gestione
 * errori e caching.
 */
@Service
@Transactional
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);
    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // ============================================================
    // TEMPLATE METHOD BASE PER LOGGING E GESTIONE ERRORI
    // ============================================================
    private <R> R executeSafely(String operationName, Function<Void, R> operation) {
        log.info("[{}] Avvio operazione EmployeeService", operationName);
        long start = System.currentTimeMillis();
        try {
            R result = operation.apply(null);
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] Completato con successo in {} ms", operationName, duration);
            return result;
        } catch (ResourceNotFoundException e) {
            log.warn("[{}] Risorsa non trovata: {}", operationName, e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("[{}] Errore di validazione input: {}", operationName, e.getMessage());
            throw e;
        } catch (DataIntegrityViolationException e) {
            log.error("[{}] Violazione integrità dati: {}", operationName, e.getMessage(), e);
            throw new EmployeeServiceException("Violazione integrità dati durante " + operationName, e);
        } catch (Exception e) {
            log.error("[{}] Errore imprevisto: {}", operationName, e.getMessage(), e);
            throw new EmployeeServiceException("Errore durante l’operazione " + operationName, e);
        }
    }

    // ============================================================
    // METODI PUBBLICI CRUD CON CACHE
    // ============================================================
    @Cacheable(value = "employees", key = "#id")
    @Transactional(readOnly = true)
    public Employee findById(Long id) {
        return executeSafely("findById", ignored -> {
            if (id == null) {
                throw new IllegalArgumentException("L'id non può essere nullo");
            }
            return employeeRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee non trovato (ID: " + id + ")"));
        });
    }

    @Transactional(readOnly = true)
    public List<Employee> findAll() {
        return executeSafely("findAll", ignored -> {
            List<Employee> result = employeeRepository.findAll();
            if (result.isEmpty()) {
                log.info("[findAll] Nessun employee trovato");
            }
            return result;
        });
    }

    @Transactional(readOnly = true)
    public List<Employee> findByName(String username) {
        return executeSafely("findByName", ignored -> {
            if (username == null || username.isBlank()) {
                throw new IllegalArgumentException("Il nome utente non può essere nullo o vuoto");
            }
            List<Employee> result = employeeRepository.findByNameContainingIgnoreCase(username);
            if (result.isEmpty()) {
                log.info("[findByName] Nessun employee trovato per '{}'", username);
            }
            return result;
        });
    }

    @CacheEvict(value = "employees", allEntries = true)
    @Transactional
    public Employee save(Employee employee) {
        return executeSafely("save", ignored -> {
            if (employee == null) {
                throw new IllegalArgumentException("Employee non può essere null");
            }
            return employeeRepository.save(employee);
        });
    }

    @CacheEvict(value = "employees", allEntries = true)
    @Transactional
    public void deleteById(Long id) {
        executeSafely("deleteById", ignored -> {
            if (id == null) {
                throw new IllegalArgumentException("L'id non può essere nullo");
            }
            if (!employeeRepository.existsById(id)) {
                throw new ResourceNotFoundException("Employee non trovato (ID: " + id + ")");
            }
            employeeRepository.deleteById(id);
            log.info("Employee {} eliminato con successo", id);
            return null;
        });
    }
}
