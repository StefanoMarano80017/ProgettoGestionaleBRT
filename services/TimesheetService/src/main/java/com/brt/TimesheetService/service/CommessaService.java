package com.brt.TimesheetService.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.repository.CommessaRepository;

@Service
public class CommessaService {

    private final CommessaRepository commessaRepository;

    public CommessaService(CommessaRepository commessaRepository) {
        this.commessaRepository = commessaRepository;
    }

    public List<Commessa> findAll() {
        return commessaRepository.findAll();
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
}
