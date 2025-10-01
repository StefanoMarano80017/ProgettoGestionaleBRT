package com.brt.TimesheetService.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.model.Progetto;

@Repository
public interface ProgettoRepository extends JpaRepository<Progetto, Long> {

    Optional<Progetto> findByCodice(String codice);

}
