package com.brt.TimesheetService.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;

@Repository
public interface TimesheetItemRepository extends JpaRepository<TimesheetItem, Long> {

    // tutti gli item di un giorno specifico
    List<TimesheetItem> findByTimesheetDay(TimesheetDay timesheetDay);

    // Aggiorna description e hours di un item
    @Modifying
    @Query("UPDATE TimesheetItem t SET t.description = :description, t.hours = :hours WHERE t.id = :itemId")
    int updateItem(Long itemId, String description, BigDecimal hours);

    // Elimina un item per id
    @Modifying
    @Query("DELETE FROM TimesheetItem t WHERE t.id = :itemId")
    int deleteItemById(Long itemId);

    // =====================================
    // QUERIES PER REPORT
    // =====================================

    // Ore totali per commessa (tutte le commesse)
    @Query("SELECT ti.commessa.id, ti.commessa.code, SUM(ti.hours) " +
           "FROM TimesheetItem ti " +
           "GROUP BY ti.commessa.id, ti.commessa.code")
    List<Object[]> aggregateHoursByCommessa();

    // Ore totali per dipendente
    @Query("SELECT td.employee.id, td.employee.name, SUM(ti.hours) " +
           "FROM TimesheetItem ti " +
           "JOIN ti.timesheetDay td " +
           "GROUP BY td.employee.id, td.employee.name")
    List<Object[]> aggregateHoursByEmployee();

    // Ore totali per tutte le commesse di un progetto specifico
    @Query("SELECT ti.commessa.id, ti.commessa.code, SUM(ti.hours) " +
           "FROM TimesheetItem ti " +
           "WHERE ti.commessa.progetto.id = :projectId " +
           "GROUP BY ti.commessa.id, ti.commessa.code")
    List<Object[]> aggregateHoursByProject(Long projectId);

    // Ore per ogni dipendente per una commessa giorno per giorno
    @Query("SELECT td.date, td.employee.id, td.employee.name, ti.commessa.id, ti.commessa.code, SUM(ti.hours) " +
           "FROM TimesheetItem ti " +
           "JOIN ti.timesheetDay td " +
           "WHERE ti.commessa.id = :commessaId " +
           "GROUP BY td.date, td.employee.id, td.employee.name, ti.commessa.id, ti.commessa.code " +
           "ORDER BY td.date, td.employee.id ")
    List<Object[]> aggregateDailyHoursByCommessa(@Param("commessaId") Long commessaId);


    // Ore per ogni commessa per un dipendente giorno per giorno
    @Query("SELECT td.date, td.employee.id, td.employee.name, ti.commessa.id, ti.commessa.code, SUM(ti.hours) " +
        "FROM TimesheetItem ti " +
        "JOIN ti.timesheetDay td " +
        "WHERE td.employee.id = :employeeId " +
        "GROUP BY td.date, td.employee.id, td.employee.name, ti.commessa.id, ti.commessa.code " +
        "ORDER BY td.date, ti.commessa.id")
    List<Object[]> aggregateDailyHoursByEmployee(Long employeeId);

}
