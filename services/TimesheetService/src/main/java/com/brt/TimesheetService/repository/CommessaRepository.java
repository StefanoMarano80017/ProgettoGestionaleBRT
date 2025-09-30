package com.brt.TimesheetService.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.model.Commessa;
import com.brt.TimesheetService.model.Progetto;

@Repository
public interface CommessaRepository extends JpaRepository<Commessa, Long> {

    Optional<Commessa> findByCode(String code);

    List<Commessa> findByProgetto(Progetto progetto);

    List<Commessa> findByNameContainingIgnoreCase(String name);

}
