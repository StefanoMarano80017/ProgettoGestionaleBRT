package com.example.deadlinemanager.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Deadline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;
    private LocalDate deadline;
    private int daysBefore;
    private boolean notified = false;

    // getters e setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public int getDaysBefore() { return daysBefore; }
    public void setDaysBefore(int daysBefore) { this.daysBefore = daysBefore; }

    public boolean isNotified() { return notified; }
    public void setNotified(boolean notified) { this.notified = notified; }
}
