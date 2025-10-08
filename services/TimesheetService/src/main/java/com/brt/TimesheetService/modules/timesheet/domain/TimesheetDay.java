package com.brt.TimesheetService.modules.timesheet.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.brt.TimesheetService.modules.user.domain.Employee;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "timesheet_days",
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"employee_id", "date"})
        },
        schema = "public"
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private TimesheetStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "absence_type")
    @Builder.Default
    private AbsenceType absenceType = AbsenceType.NONE;

    @OneToMany(mappedBy = "timesheetDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TimesheetItem> items = new ArrayList<>();

    @Version
    private Long version;

    // Helper methods per gestire i items
    public void addItem(TimesheetItem item) {
        items.add(item);
        item.setTimesheetDay(this);
    }

    public void removeItem(TimesheetItem item) {
        items.remove(item);
        item.setTimesheetDay(null);
    }
}
