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
import org.springframework.web.bind.annotation.RestController;

import com.brt.TimesheetService.dto.CommessaDTO;
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.service.CommessaService;

@RestController
@RequestMapping("/commesse")
public class CommessaController {

    private final CommessaService commessaService;
    public CommessaController(CommessaService commessaService) {
        this.commessaService = commessaService;
    }

    /** Lista tutte le commesse  */
    @GetMapping
    public ResponseEntity<List<CommessaDTO>> getAllCommesse() {
        List<Commessa> commesse = commessaService.findAll();
        List<CommessaDTO> dtos = commesse.stream().map(commessaDTO -> commessaService.mapToDTO(commessaDTO)).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /** Recupera una commessa per ID */
    @GetMapping("/{id}")
    public ResponseEntity<CommessaDTO> getCommessa(@PathVariable Long id) {
        Commessa commessa = commessaService.findById(id);
        return ResponseEntity.ok(commessaService.mapToDTO(commessa));
    }

    /** Crea una nuova commessa */
    @PostMapping
    public ResponseEntity<CommessaDTO> createCommessa(@RequestBody CommessaDTO dto) {
        Commessa newCommessa = commessaService.CreateCommessa(dto.getCode());
        return ResponseEntity.status(201).body(commessaService.mapToDTO(newCommessa));
    }

    /** Aggiorna una commessa esistente */
    @PutMapping("/{id}")
    public ResponseEntity<CommessaDTO> updateCommessa(@PathVariable Long id, @RequestBody CommessaDTO dto) {
        Commessa existing = commessaService.findById(id);
        if(existing == null) {
            return ResponseEntity.notFound().build();
        }
        existing.setCode(dto.getCode());
        Commessa updated = commessaService.save(existing);
        return ResponseEntity.ok(commessaService.mapToDTO(updated));
    }

    /** Cancella una commessa */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCommessa(@PathVariable Long id) {
        commessaService.findById(id);
        commessaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
