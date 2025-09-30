package com.brt.TimesheetService.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.CommessaDTO;
import com.brt.TimesheetService.exception.ResourceNotFoundException;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Progetto;
import com.brt.TimesheetService.service.CommessaService;
import com.brt.TimesheetService.service.ProgettoService;

@RestController
@RequestMapping("/commesse")
public class CommessaController {

    private final CommessaService commessaService;
    private final ProgettoService progettoService;

    public CommessaController(CommessaService commessaService, ProgettoService progettoService) {
        this.commessaService = commessaService;
        this.progettoService = progettoService;
    }

    /** Lista tutte le commesse (opzionalmente filtrate per progetto) */
    @GetMapping
    public ResponseEntity<List<CommessaDTO>> getAllCommesse(@RequestParam(required = false) Long progettoId) {
        List<Commessa> commesse;
        if (progettoId != null) {
            Progetto progetto = progettoService.findById(progettoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Progetto non trovato: " + progettoId));
            commesse = commessaService.findByProgetto(progetto);
        } else {
            commesse = commessaService.findAll();
        }

        List<CommessaDTO> dtos = commesse.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /** Recupera una commessa per ID */
    @GetMapping("/{id}")
    public ResponseEntity<CommessaDTO> getCommessa(@PathVariable Long id) {
        Commessa commessa = commessaService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata: " + id));
        return ResponseEntity.ok(mapToDTO(commessa));
    }

    /** Crea una nuova commessa */
    @PostMapping
    public ResponseEntity<CommessaDTO> createCommessa(@RequestBody CommessaDTO dto) {
        Progetto progetto = null;
        if (dto.getProgettoId() != null) {
            progetto = progettoService.findById(dto.getProgettoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Progetto non trovato: " + dto.getProgettoId()));
        }

        Commessa commessa = Commessa.builder()
                .code(dto.getCode())
                .progetto(progetto)
                .build();

        Commessa saved = commessaService.save(commessa);
        return ResponseEntity.status(201).body(mapToDTO(saved));
    }

    /** Aggiorna una commessa esistente */
    @PutMapping("/{id}")
    public ResponseEntity<CommessaDTO> updateCommessa(@PathVariable Long id, @RequestBody CommessaDTO dto) {
        Commessa existing = commessaService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata: " + id));

        existing.setCode(dto.getCode());

        if (dto.getProgettoId() != null) {
            Progetto progetto = progettoService.findById(dto.getProgettoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Progetto non trovato: " + dto.getProgettoId()));
            existing.setProgetto(progetto);
        } else {
            existing.setProgetto(null);
        }

        Commessa updated = commessaService.save(existing);
        return ResponseEntity.ok(mapToDTO(updated));
    }

    /** Cancella una commessa */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCommessa(@PathVariable Long id) {
        commessaService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commessa non trovata: " + id));
        commessaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Mappa entity → DTO */
    private CommessaDTO mapToDTO(Commessa commessa) {
        return CommessaDTO.builder()
                .id(commessa.getId())
                .code(commessa.getCode())
                .progettoId(commessa.getProgetto() != null ? commessa.getProgetto().getId() : null)
                .build();
    }
}
