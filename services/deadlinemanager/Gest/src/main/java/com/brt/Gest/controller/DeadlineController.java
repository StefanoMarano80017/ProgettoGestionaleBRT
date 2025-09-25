package com.brt.deadlinemanager.Gest.src.main.controller;

import com.brt.Gest.example.deadlinemanager.model.Deadline;
import com.brt.Gest.example.deadlinemanager.repository.DeadlineRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/deadlines")
public class DeadlineController {

    private final DeadlineRepository repository;

    public DeadlineController(DeadlineRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Deadline> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Deadline create(@RequestBody Deadline deadline) {
        return repository.save(deadline);
    }
}
