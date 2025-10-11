// src/pages/Commesse.jsx
import React from "react";
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { ComingSoonPage } from '@shared/components/ComingSoon/';

const commesseFeatures = [
  {
    emoji: '📋',
    title: 'Creazione e gestione commesse',
    description: 'Crea nuove commesse, modifica quelle esistenti e gestisci tutti i dettagli'
  },
  {
    emoji: '👥',
    title: 'Assegnazione risorse',
    description: 'Assegna dipendenti e team alle commesse in modo efficiente'
  },
  {
    emoji: '📊',
    title: 'Monitoraggio avanzamento',
    description: 'Monitora lo stato di avanzamento e le performance delle commesse'
  },
  {
    emoji: '💰',
    title: 'Budget e costi',
    description: 'Gestisci budget, traccia i costi e genera report finanziari'
  },
  {
    emoji: '📈',
    title: 'Report e analytics',
    description: 'Visualizza statistiche dettagliate e genera report personalizzati'
  },
  {
    emoji: '🔔',
    title: 'Notifiche e alert',
    description: 'Ricevi notifiche automatiche su scadenze, milestone e eventi importanti'
  }
];

export default function Commesse() {
  return (
    <ComingSoonPage
      title="Gestione Commesse"
      subtitle="Sistema di gestione e monitoraggio delle commesse aziendali"
      icon={BusinessCenterIcon}
      color="secondary"
      features={commesseFeatures}
    />
  );
}
