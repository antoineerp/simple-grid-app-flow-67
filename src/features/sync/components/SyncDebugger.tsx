
import React from 'react';

/**
 * Composant de débogage de synchronisation (désactivé)
 */
interface SyncDebuggerProps {
  enabled?: boolean;
}

const SyncDebugger: React.FC<SyncDebuggerProps> = ({ enabled }) => {
  // Même si le prop enabled est passé, le composant reste désactivé
  return null; // Fonctionnalité désactivée
};

export default SyncDebugger;
