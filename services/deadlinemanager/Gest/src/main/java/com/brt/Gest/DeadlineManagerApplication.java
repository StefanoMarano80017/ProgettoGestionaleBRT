package com.brt.Gest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DeadlineManagerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DeadlineManagerApplication.class, args);
    }
}
