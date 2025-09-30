package com.brt.TimesheetService.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "progetti")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Progetto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codice;

    @Column(nullable = false)
    private String nome;

    private String descrizione;

    @OneToMany(mappedBy = "progetto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Commessa> commesse = new ArrayList<>();

    // Helper methods
    public void addCommessa(Commessa commessa) {
        commesse.add(commessa);
        commessa.setProgetto(this);
    }

    public void removeCommessa(Commessa commessa) {
        commesse.remove(commessa);
        commessa.setProgetto(null);
    }
}
