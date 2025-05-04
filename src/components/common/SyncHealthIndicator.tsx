
import React from 'react';

interface SyncHealthIndicatorProps {
  position?: 'top-right' | 'bottom-right';
  showDetails?: boolean;
}

// Composant désactivé pour ne plus montrer d'informations de synchronisation
const SyncHealthIndicator: React.FC<SyncHealthIndicatorProps> = () => {
  // Ne rien afficher
  return null;
};

export default SyncHealthIndicator;
