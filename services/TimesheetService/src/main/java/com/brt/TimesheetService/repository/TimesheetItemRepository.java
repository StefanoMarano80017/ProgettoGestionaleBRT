package com.brt.TimesheetService.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.dto.CommessaHoursDTO;
import com.brt.TimesheetService.dto.DailyHoursReportDTO;
import com.brt.TimesheetService.dto.EmployeeTotalHoursDTO;
import com.brt.TimesheetService.dto.ReportDTOs.EmployeeCommessaHoursDTO;
import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;

@Repository
public interface TimesheetItemRepository extends JpaRepository<TimesheetItem, Long> {

    // Totale ore per commessa per un dipendente in un intervallo di date
    @Query("SELECT new com.brt.TimesheetService.dto.ReportDTOs.EmployeeCommessaHoursDTO(" +
       "e.id, e.name, c.id, c.code, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.commessa c " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "WHERE c.code = :commessaCode AND td.date BETWEEN :startDate AND :endDate " +
       "GROUP BY e.id, e.name, c.id, c.code")
    Page<EmployeeCommessaHoursDTO> getTotalHoursByCommessaForEmployee(@Param("commessaCode") String commessaCode, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    // tutti gli item di un giorno specifico
       Page<TimesheetItem> findByTimesheetDay(TimesheetDay timesheetDay, Pageable pageable);

    // Aggiorna description e hours di un item
    @Modifying
    @Query("UPDATE TimesheetItem t SET t.description = :description, t.hours = :hours WHERE t.id = :itemId")
    int updateItem(@Param("itemId") Long itemId, @Param("description") String description, @Param("hours") BigDecimal hours);

    // Elimina un item per id
    @Modifying
    @Query("DELETE FROM TimesheetItem t WHERE t.id = :itemId")
    int deleteItemById(@Param("itemId") Long itemId);

    // =====================================
    // QUERIES PER REPORT
    // =====================================

       // Ore totali per commessa 
      @Query("SELECT new com.brt.TimesheetService.dto.CommessaHoursDTO(" +
      "c.id, c.code, SUM(ti.hours), null) " +
      "FROM TimesheetItem ti " +
      "JOIN ti.commessa c " +
      "JOIN ti.timesheetDay td " +
      "WHERE td.date BETWEEN :startDate AND :endDate " +
      "GROUP BY c.id, c.code")
      Page<CommessaHoursDTO> aggregateHoursByCommessa(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

       // Ore totali per dipendente 
       @Query("SELECT new com.brt.TimesheetService.dto.EmployeeTotalHoursDTO(" +
       "e.id, e.name, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "GROUP BY e.id, e.name")
       Page<EmployeeTotalHoursDTO> aggregateHoursByEmployee(Pageable pageable);

       // Aggregazione per tutte le commesse
       @Query("SELECT new com.brt.TimesheetService.dto.DailyHoursReportDTO(" +
       "td.date, e.id, e.name, c.id, c.code, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "JOIN ti.commessa c " +
       "GROUP BY c.id, c.code, td.date, e.id, e.name " +
       "ORDER BY c.code, td.date, e.name")
       Page<DailyHoursReportDTO> aggregateDailyHoursAllCommesse(Pageable pageable);

       // Aggregazione per una sola commessa filtrata per codice
       @Query("SELECT new com.brt.TimesheetService.dto.DailyHoursReportDTO(" +
       "td.date, e.id, e.name, c.id, c.code, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "JOIN ti.commessa c " +
       "WHERE c.code = :commessaCode " +
       "GROUP BY c.id, c.code, td.date, e.id, e.name " +
       "ORDER BY td.date, e.name")
       Page<DailyHoursReportDTO> aggregateDailyHoursByCommessa(@Param("commessaCode") String commessaCode, Pageable pageable);

       // Ore di un dipendente su una commessa in un intervallo di date
       @Query("SELECT new com.brt.TimesheetService.dto.ReportDTOs.EmployeeCommessaHoursDTO(" +
       "e.id, e.name, c.id, c.code, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "JOIN ti.commessa c " +
       "WHERE e.id = :employeeId " +
       "AND c.code = :commessaCode " +
       "AND td.date BETWEEN :startDate AND :endDate " +
       "GROUP BY e.id, e.name, c.id, c.code")
       Page<EmployeeCommessaHoursDTO> getHoursByEmployeeAndCommessa(@Param("employeeId") Long employeeId, @Param("commessaCode") String commessaCode,
                                                                                                         @Param("startDate") LocalDate startDate,@Param("endDate") LocalDate endDate, Pageable pageable);

       //Ore di un dipendente su tutte le commesse in un intervallo di date
       @Query("SELECT new com.brt.TimesheetService.dto.ReportDTOs.EmployeeCommessaHoursDTO(" +
       "e.id, e.name, null, null, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "WHERE e.id = :employeeId " +
       "AND td.date BETWEEN :startDate AND :endDate " +
       "GROUP BY e.id, e.name")
       Page<EmployeeCommessaHoursDTO> getHoursByEmployeeAllCommesse(
       @Param("employeeId") Long employeeId,
       @Param("startDate") LocalDate startDate,
       @Param("endDate") LocalDate endDate, Pageable pageable);


              // Aggregazione per tutte le commesse con filtro data
       @Query("SELECT new com.brt.TimesheetService.dto.DailyHoursReportDTO(" +
       "td.date, e.id, e.name, c.id, c.code, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "JOIN ti.commessa c " +
       "WHERE td.date BETWEEN :startDate AND :endDate " +
       "GROUP BY c.id, c.code, td.date, e.id, e.name " +
       "ORDER BY c.code, td.date, e.name")
       Page<DailyHoursReportDTO> aggregateDailyHoursAllCommesseByDate(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

       // Aggregazione per una sola commessa filtrata per codice e data
       @Query("SELECT new com.brt.TimesheetService.dto.DailyHoursReportDTO(" +
       "td.date, e.id, e.name, c.id, c.code, SUM(ti.hours)) " +
       "FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "JOIN ti.commessa c " +
       "WHERE c.code = :commessaCode AND td.date BETWEEN :startDate AND :endDate " +
       "GROUP BY c.id, c.code, td.date, e.id, e.name " +
       "ORDER BY td.date, e.name")
       Page<DailyHoursReportDTO> aggregateDailyHoursByCommessaAndDate(@Param("commessaCode") String commessaCode, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);


       // Distinct employee names for a commessa in a date range
       @Query("SELECT DISTINCT e.name FROM TimesheetItem ti " +
       "JOIN ti.timesheetDay td " +
       "JOIN td.employee e " +
       "JOIN ti.commessa c " +
       "WHERE c.id = :commessaId AND td.date BETWEEN :startDate AND :endDate")
       List<String> findDistinctEmployeeNamesByCommessaAndDate(@Param("commessaId") Long commessaId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}