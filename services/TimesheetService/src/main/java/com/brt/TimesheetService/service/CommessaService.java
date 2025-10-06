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

package com.brt.TimesheetService.service;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.dto.CommessaDTO;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.repository.CommessaRepository;

@Service
public class CommessaService {

    private final CommessaRepository commessaRepository;

    public CommessaService(CommessaRepository commessaRepository) {
        this.commessaRepository = commessaRepository;
    }

    public Page<Commessa> findAll(Pageable pageable) {
        return commessaRepository.findAll(pageable);
    }

    public Commessa findById(Long id) {
        return commessaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Commessa non trovata con id: " + id));
    }

    public Optional<Commessa> findByCode(String code) {
        return commessaRepository.findByCode(code);
    }

    @Transactional
    public Commessa save(Commessa commessa) {
        return commessaRepository.save(commessa);
    }

    @Transactional
    public void deleteById(Long id) {
        commessaRepository.deleteById(id);
    }

    /**
     * Recupera una commessa per codice
     */
    @Transactional
    public Commessa getCommessa(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Il codice della commessa non può essere nullo o vuoto");
        }
        return commessaRepository.findByCode(code).orElseThrow(() ->
            new IllegalArgumentException("Commessa non trovata con codice: " + code)
        );
    }

    public Commessa CreateCommessa(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Il codice della commessa non può essere nullo o vuoto");
        }
        Commessa existing = commessaRepository.findByCode(code).orElse(null);
        if (existing != null) {
            throw new IllegalArgumentException("Commessa già esistente con codice: " + code);
        }
        Commessa newCommessa = Commessa.builder().code(code).build();
        return commessaRepository.save(newCommessa);
    }

    /** Mappa entity → DTO */
    public CommessaDTO mapToDTO(Commessa commessa) {
        return CommessaDTO.builder()
                .id(commessa.getId())
                .code(commessa.getCode())
                .build();
    }
}
