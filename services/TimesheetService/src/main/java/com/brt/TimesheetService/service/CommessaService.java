package com.brt.TimesheetService.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Progetto;
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

    public List<Commessa> findByProgetto(Progetto progetto) {
        return commessaRepository.findByProgetto(progetto);
    }

    public Optional<Commessa> findById(Long id) {
        return commessaRepository.findById(id);
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
     * Recupera una commessa per codice, se non esiste la crea.
     */
    @Transactional
    public Commessa getOrCreateCommessa(String code) {
        return commessaRepository.findByCode(code)
                .orElseGet(() -> {
                    Commessa newCommessa = Commessa.builder()
                            .code(code)
                            .build();
                    return commessaRepository.save(newCommessa);
                });
    }
}
