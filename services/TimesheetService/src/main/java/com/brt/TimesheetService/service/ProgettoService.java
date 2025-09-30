package com.brt.TimesheetService.service;

import com.brt.TimesheetService.model.Progetto;
import com.brt.TimesheetService.repository.ProgettoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProgettoService {

    private final ProgettoRepository progettoRepository;

    public ProgettoService(ProgettoRepository progettoRepository) {
        this.progettoRepository = progettoRepository;
    }

    public List<Progetto> findAll() {
        return progettoRepository.findAll();
    }

    public Optional<Progetto> findById(Long id) {
        return progettoRepository.findById(id);
    }

    @Transactional
    public Progetto save(Progetto progetto) {
        return progettoRepository.save(progetto);
    }

    @Transactional
    public void deleteById(Long id) {
        progettoRepository.deleteById(id);
    }

    /**
     * Cerca un progetto per codice, se non trovato lancia eccezione.
     */
    public Progetto findByCodeOrThrow(String code) {
        return progettoRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Progetto non trovato: " + code));
    }
}
