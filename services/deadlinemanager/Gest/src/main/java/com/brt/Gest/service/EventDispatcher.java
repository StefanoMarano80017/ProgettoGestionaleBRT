package com.example.deadlinemanager.service;

import com.example.deadlinemanager.model.Deadline;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventDispatcher {

    private final RabbitTemplate rabbitTemplate;

    public EventDispatcher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendEvent(Deadline deadline) {
        rabbitTemplate.convertAndSend("deadline_events", 
            "Deadline imminente: " + deadline.getDescription() + " - " + deadline.getDeadline()
        );
    }
}
