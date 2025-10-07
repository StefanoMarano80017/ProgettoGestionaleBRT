package com.brt.TimesheetService.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.service.CommessaService;
import com.brt.TimesheetService.util.PageableUtils;

@RestController
@RequestMapping("/commesse")
public class CommessaController {

    private final CommessaService commessaService;

    public CommessaController(CommessaService commessaService) {
        this.commessaService = commessaService;
    }

    /**
     * Lista tutte le commesse
     */
    @GetMapping
    public ResponseEntity<Page<Commessa>> getAllCommesse(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction
    ) {
        Pageable pageable = PageableUtils.createSafePageable(page, size, sortBy, direction);
        return ResponseEntity.ok(commessaService.findAll(pageable));
    }

    /**
     * Recupera una commessa per ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CommessaDTO> getCommessa(@PathVariable Long id) {
        Commessa commessa = commessaService.findById(id);
        return ResponseEntity.ok(commessaService.mapToDTO(commessa));
    }

    /**
     * Crea una nuova commessa
     */
    @PostMapping
    public ResponseEntity<CommessaDTO> createCommessa(@RequestBody CommessaDTO dto) {
        Commessa newCommessa = commessaService.createCommessa(dto.getCode());
        return ResponseEntity.status(201).body(commessaService.mapToDTO(newCommessa));
    }

    /**
     * Aggiorna una commessa esistente
     */
    @PutMapping("/{id}")
    public ResponseEntity<CommessaDTO> updateCommessa(@PathVariable Long id, @RequestBody CommessaDTO dto) {
        Commessa existing = commessaService.findById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        existing.setCode(dto.getCode());
        Commessa updated = commessaService.save(existing);
        return ResponseEntity.ok(commessaService.mapToDTO(updated));
    }

    /**
     * Cancella una commessa
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCommessa(@PathVariable Long id) {
        commessaService.findById(id);
        commessaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
