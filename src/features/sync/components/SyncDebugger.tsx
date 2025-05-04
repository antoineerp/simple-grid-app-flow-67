
import React from 'react';

interface SyncDebuggerProps {
  enabled?: boolean;
}

// Version simplifiée du débogueur de synchronisation (ne fait rien)
const SyncDebugger: React.FC<SyncDebuggerProps> = ({ enabled = false }) => {
  // Ne rien afficher, fonctionnalité désactivée
  if (!enabled) return null;
  
  return (
    <div className="hidden">
      {/* Débogage de synchronisation désactivé */}
    </div>
  );
};

export default SyncDebugger;
