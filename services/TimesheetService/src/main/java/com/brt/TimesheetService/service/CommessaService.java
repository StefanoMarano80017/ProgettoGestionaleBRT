/*
 *   Copyright (c) 2025 Stefano Marano https://github.com/StefanoMarano80017
 *   All rights reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   You may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
package com.brt.TimesheetService.service;

import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.CommessaDTO;
import com.brt.TimesheetService.exception.CommessaServiceException;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.repository.CommessaRepository;

/**
 * Servizio per la gestione delle Commessa con logging, validazioni, gestione
 * errori e caching.
 */
@Service
@Transactional
public class CommessaService {

    private static final Logger log = LoggerFactory.getLogger(CommessaService.class);
    /*
    *   in futuro si può sostituire la repo con un provider REST + Redis cache 
     */
    private final CommessaRepository commessaRepository;

    public CommessaService(CommessaRepository commessaRepository) {
        this.commessaRepository = commessaRepository;
    }

    // ============================================================
    // TEMPLATE METHOD BASE PER LOGGING E GESTIONE ERRORI
    // ============================================================
    private <R> R executeSafely(String operationName, Function<Void, R> operation) {
        log.info("[{}] Avvio operazione CommessaService", operationName);
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
            throw new CommessaServiceException("Violazione integrità dati durante " + operationName, e);
        } catch (Exception e) {
            log.error("[{}] Errore imprevisto: {}", operationName, e.getMessage(), e);
            throw new CommessaServiceException("Errore durante l’operazione " + operationName, e);
        }
    }

    // ============================================================
    // CRUD CON CACHE
    // ============================================================
    @Cacheable(value = "commesse", key = "#id")
    @Transactional(readOnly = true)
    public Commessa findById(Long id) {
        return executeSafely("findById", ignored -> {
            if (id == null) {
                throw new IllegalArgumentException("L'id non può essere nullo");
            }
            return commessaRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata con id: " + id));
        });
    }

    @Cacheable(value = "commesse", key = "#code")
    @Transactional(readOnly = true)
    public Commessa getCommessa(String code) {
        return executeSafely("getCommessa", ignored -> {
            if (code == null || code.isBlank()) {
                throw new IllegalArgumentException("Il codice commessa non può essere nullo o vuoto");
            }
            return commessaRepository.findByCode(code)
                    .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata con codice: " + code));
        });
    }

    @Transactional
    @CacheEvict(value = "commesse", allEntries = true)
    public Commessa save(Commessa commessa) {
        return executeSafely("save", ignored -> {
            if (commessa == null) {
                throw new IllegalArgumentException("La commessa non può essere null");
            }
            return commessaRepository.save(commessa);
        });
    }

    @Transactional
    @CacheEvict(value = "commesse", allEntries = true)
    public Commessa createCommessa(String code) {
        return executeSafely("createCommessa", ignored -> {
            if (code == null || code.isBlank()) {
                throw new IllegalArgumentException("Il codice commessa non può essere nullo o vuoto");
            }
            commessaRepository.findByCode(code).ifPresent(existing -> {
                throw new IllegalArgumentException("Commessa già esistente con codice: " + code);
            });
            Commessa newCommessa = Commessa.builder().code(code).build();
            return commessaRepository.save(newCommessa);
        });
    }

    @Transactional
    @CacheEvict(value = "commesse", allEntries = true)
    public void deleteById(Long id) {
        executeSafely("deleteById", ignored -> {
            if (id == null) {
                throw new IllegalArgumentException("L'id non può essere nullo");
            }
            if (!commessaRepository.existsById(id)) {
                throw new ResourceNotFoundException("Commessa non trovata con id: " + id);
            }
            commessaRepository.deleteById(id);
            log.info("[deleteById] Commessa {} eliminata con successo", id);
            return null;
        });
    }

    @Transactional(readOnly = true)
    public Page<Commessa> findAll(Pageable pageable) {
        return executeSafely("findAll", ignored -> {
            Page<Commessa> page = commessaRepository.findAll(pageable);
            if (page.isEmpty()) {
                log.info("[findAll] Nessuna commessa trovata");
            }
            return page;
        });
    }

    // ============================================================
    // MAPPATURA ENTITY → DTO
    // ============================================================
    public CommessaDTO mapToDTO(Commessa commessa) {
        if (commessa == null) {
            throw new IllegalArgumentException("Commessa non può essere null per il mapping a DTO");
        }
        return CommessaDTO.builder()
                .id(commessa.getId())
                .code(commessa.getCode())
                .build();
    }
}
