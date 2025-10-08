package com.brt.TimesheetService;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableCaching
@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.brt.TimesheetService.modules")
@EntityScan(basePackages = "com.brt.TimesheetService.modules")
public class TimesheetServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimesheetServiceApplication.class, args);
    }

}
