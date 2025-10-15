// src/pages/Home.jsx
import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { PAGES } from "@/Routes/pagesConfig";
import useAuth from "@/domains/auth/hooks/useAuth";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import { PageHero } from '@shared/components/PageHeader/';
import { StatCard } from '@shared/components/Stats/';
import { ServiceCard } from '@shared/components/ServiceCard/';

// Service descriptions mapping
const SERVICE_DESCRIPTIONS = {
  'TimeSheet': 'Gestisci le tue ore di lavoro e monitora i progetti assegnati',
  'Commesse': 'Gestisci e monitora le commesse aziendali e l\'assegnazione delle risorse',
  'Dashboard Coordinatore': 'Visualizza lo stato delle commesse, assegna risorse e monitora il workload del team',
};

const renderIcon = (IconOrElement) => {
  if (React.isValidElement(IconOrElement)) {
    return IconOrElement.type;
  }
  return IconOrElement;
};

export default function Home() {
  const { user } = useAuth();
  const displayName = user ? `${user.nome} ${user.cognome}` : 'Utente';
  const firstName = user?.nome || 'Utente';

  // Filtra via la voce Home
  const SERVICES = React.useMemo(
    () => PAGES.filter((p) => p?.path?.toLowerCase() !== "/home" && p?.text?.toLowerCase() !== "home"),
    []
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100%',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Box
        sx={{
          width: '100%',
          px: { xs: 2, md: 4 },
          mx: 'auto',
        }}
      >
        {/* Hero Section - Welcome */}
        <PageHero
          title={`Benvenuto, ${firstName}!`}
          subtitle="Gestisci il tuo lavoro in modo efficiente con il sistema gestionale BRT"
          icon={WavingHandIcon}
          color="primary"
          showAnimation={true}
          useCustomBlueGradient={true}
        />

        {/* Quick Stats */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          <StatCard
            label="Servizi Attivi"
            value={SERVICES.length}
            icon={TrendingUpIcon}
            color="success"
          />

          <StatCard
            label="Utente"
            value={displayName}
            color="secondary"
            valueVariant="body1"
            badge={
              <Chip 
                label="Attivo" 
                size="small" 
                color="success" 
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            }
          />

          <StatCard
            label="Ultima Visita"
            value="Oggi"
            color="warning"
            valueVariant="body1"
          />

          <StatCard
            label="Versione"
            value="v1.0.0"
            color="info"
            valueVariant="body1"
          />
        </Box>

        {/* Main Navigation Hub */}
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Applicazioni
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {SERVICES.map(({ text, icon, path }) => {
            const IconComponent = renderIcon(icon);
            const description = SERVICE_DESCRIPTIONS[text] || 'Accedi ai servizi e alle funzionalità dell\'applicazione';
            
            return (
              <ServiceCard
                key={text}
                title={text}
                description={description}
                path={path}
                icon={IconComponent}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
