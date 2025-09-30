package com.brt.TimesheetService.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "progetti", schema = "public")
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
