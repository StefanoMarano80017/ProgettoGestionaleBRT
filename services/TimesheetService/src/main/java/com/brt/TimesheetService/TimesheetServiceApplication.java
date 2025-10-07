package com.brt.TimesheetService;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class TimesheetServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimesheetServiceApplication.class, args);
    }

}
