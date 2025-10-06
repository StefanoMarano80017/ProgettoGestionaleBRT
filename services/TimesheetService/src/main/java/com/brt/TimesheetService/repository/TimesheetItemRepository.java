package com.brt.TimesheetService.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.brt.TimesheetService.model.TimesheetDay;
import com.brt.TimesheetService.model.TimesheetItem;
import com.brt.TimesheetService.projection.CommessaHoursProjection;
import com.brt.TimesheetService.projection.DailyHoursReportProjection;
import com.brt.TimesheetService.projection.EmployeeCommessaHoursProjection;
import com.brt.TimesheetService.projection.EmployeeTotalHoursProjection;

@Repository
public interface TimesheetItemRepository extends JpaRepository<TimesheetItem, Long> {

    // ====================================================
    // OPERAZIONI DI BASE
    // ====================================================
    
    Page<TimesheetItem> findByTimesheetDay(TimesheetDay timesheetDay, Pageable pageable);

    @Modifying
    @Query("UPDATE TimesheetItem t SET t.description = :description, t.hours = :hours WHERE t.id = :itemId")
    int updateItem(@Param("itemId") Long itemId, @Param("description") String description, @Param("hours") java.math.BigDecimal hours);

    @Modifying
    @Query("DELETE FROM TimesheetItem t WHERE t.id = :itemId")
    int deleteItemById(@Param("itemId") Long itemId);

    // ====================================================
    // QUERIES REPORT CON PROJECTIONS
    // ====================================================
    // Ore totali per dipendente
    @Query("""
        SELECT new com.brt.TimesheetService.projection.EmployeeTotalHoursProjection(
            e.id, e.name, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        WHERE td.date BETWEEN :startDate AND :endDate
        GROUP BY e.id, e.name
    """)
    Page<EmployeeTotalHoursProjection> aggregateHoursByEmployee(@Param("startDate") LocalDate startDate,
                                                                @Param("endDate") LocalDate endDate, Pageable pageable);

    // Ore totali per commessa (employeeNames separato)
    @Query("""
        SELECT new com.brt.TimesheetService.projection.CommessaHoursProjection(
            c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.commessa c
        JOIN ti.timesheetDay td
        WHERE td.date BETWEEN :startDate AND :endDate
        GROUP BY c.id, c.code
    """)
    Page<CommessaHoursProjection> aggregateHoursByCommessa(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    // Totale ore per una singola commessa (per tutti i dipendenti)
    @Query("""
        SELECT new com.brt.TimesheetService.projection.CommessaHoursProjection(
            c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.commessa c
        JOIN ti.timesheetDay td
        WHERE c.code = :commessaCode
        AND td.date BETWEEN :startDate AND :endDate
        GROUP BY c.id, c.code
    """)
    Page<CommessaHoursProjection> aggregateHoursForSingleCommessa(
        @Param("commessaCode") String commessaCode,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    // Lista dipendenti distinti per una commessa
    @Query("""
        SELECT DISTINCT e.name
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE c.id = :commessaId AND td.date BETWEEN :startDate AND :endDate
    """)
    List<String> findDistinctEmployeeNamesByCommessaAndDate(
        @Param("commessaId") Long commessaId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // ====================================================
    // DAILY HOURS QUERIES
    // ====================================================

    // Aggregazione per tutte le commesse
    @Query("""
        SELECT new com.brt.TimesheetService.projection.DailyHoursReportProjection(
            td.date, e.id, e.name, c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE td.date BETWEEN :startDate AND :endDate
        GROUP BY c.id, c.code, td.date, e.id, e.name
        ORDER BY c.code, td.date, e.name
    """)
    Page<DailyHoursReportProjection> aggregateDailyHoursAllCommesse( @Param("startDate") LocalDate startDate,
                                                                     @Param("endDate") LocalDate endDate, Pageable pageable);

    // Aggregazione per tutte le commesse con filtro data
    @Query("""
        SELECT new com.brt.TimesheetService.projection.DailyHoursReportProjection(
            td.date, e.id, e.name, c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE td.date BETWEEN :startDate AND :endDate
        GROUP BY c.id, c.code, td.date, e.id, e.name
        ORDER BY c.code, td.date, e.name
    """)
    Page<DailyHoursReportProjection> aggregateDailyHoursAllCommesseByDate(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    // Aggregazione per una sola commessa
    @Query("""
        SELECT new com.brt.TimesheetService.projection.DailyHoursReportProjection(
            td.date, e.id, e.name, c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE c.code = :commessaCode
        GROUP BY c.id, c.code, td.date, e.id, e.name
        ORDER BY td.date, e.name
    """)
    Page<DailyHoursReportProjection> aggregateDailyHoursByCommessa(
        @Param("commessaCode") String commessaCode,
        Pageable pageable
    );

    // Aggregazione per una sola commessa filtrata per codice e date
    @Query("""
        SELECT new com.brt.TimesheetService.projection.DailyHoursReportProjection(
            td.date, e.id, e.name, c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE c.code = :commessaCode AND td.date BETWEEN :startDate AND :endDate
        GROUP BY c.id, c.code, td.date, e.id, e.name
        ORDER BY td.date, e.name
    """)
    Page<DailyHoursReportProjection> aggregateDailyHoursByCommessaAndDate(
        @Param("commessaCode") String commessaCode,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    // Ore di un dipendente su tutte le commesse in un intervallo di date
    @Query("""
        SELECT new com.brt.TimesheetService.projection.EmployeeCommessaHoursProjection(
            e.id, e.name, null, null, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        WHERE e.id = :employeeId
        AND td.date BETWEEN :startDate AND :endDate
        GROUP BY e.id, e.name
    """)
    Page<EmployeeCommessaHoursProjection> getHoursByEmployeeAllCommesse(
        @Param("employeeId") Long employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    // Ore di un dipendente su una commessa in un intervallo di date
    @Query("""
        SELECT new com.brt.TimesheetService.projection.EmployeeCommessaHoursProjection(
            e.id, e.name, c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE e.id = :employeeId
        AND c.code = :commessaCode
        AND td.date BETWEEN :startDate AND :endDate
        GROUP BY e.id, e.name, c.id, c.code
    """)
    Page<EmployeeCommessaHoursProjection> getHoursByEmployeeAndCommessa(
        @Param("employeeId") Long employeeId,
        @Param("commessaCode") String commessaCode,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
    // Ore totali dei dipendenti per una singola commessa
    @Query("""
        SELECT new com.brt.TimesheetService.projection.EmployeeCommessaHoursProjection(
            e.id, e.name, c.id, c.code, SUM(ti.hours))
        FROM TimesheetItem ti
        JOIN ti.timesheetDay td
        JOIN td.employee e
        JOIN ti.commessa c
        WHERE c.code = :commessaCode
        AND td.date BETWEEN :startDate AND :endDate
        GROUP BY e.id, e.name, c.id, c.code
    """)
    Page<EmployeeCommessaHoursProjection> getTotalHoursPerEmployeeForCommessa(
        @Param("commessaCode") String commessaCode,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
}