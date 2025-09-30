package com.brt.TimesheetService.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "timesheet_days",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "date"})
    }
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
