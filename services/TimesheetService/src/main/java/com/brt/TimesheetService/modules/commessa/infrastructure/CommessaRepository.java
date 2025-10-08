package com.brt.TimesheetService.modules.commessa.infrastructure;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.modules.commessa.domain.Commessa;

@Repository
public interface CommessaRepository extends JpaRepository<Commessa, Long> {

    Optional<Commessa> findByCode(String code);
}
