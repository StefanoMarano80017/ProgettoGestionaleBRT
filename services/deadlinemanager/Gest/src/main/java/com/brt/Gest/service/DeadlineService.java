package com.example.deadlinemanager.service;

import com.example.deadlinemanager.model.Deadline;
import com.example.deadlinemanager.repository.DeadlineRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DeadlineService {

    private final DeadlineRepository repository;
    private final EventDispatcher dispatcher;

    public DeadlineService(DeadlineRepository repository, EventDispatcher dispatcher) {
        this.repository = repository;
        this.dispatcher = dispatcher;
    }

    @Scheduled(cron = "0 0 9 * * *") // ogni giorno alle 9:00
    public void checkDeadlines() {
        LocalDate today = LocalDate.now();
        List<Deadline> deadlines = repository.findByNotifiedFalse();

        for (Deadline d : deadlines) {
            LocalDate notifyDate = d.getDeadline().minusDays(d.getDaysBefore());
            if (today.equals(notifyDate)) {
                dispatcher.sendEvent(d);
                d.setNotified(true);
                repository.save(d);
            }
        }
    }
}
