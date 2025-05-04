
import React from 'react';

interface SyncDebuggerProps {
  enabled?: boolean;
}

const SyncDebugger: React.FC<SyncDebuggerProps> = ({ enabled = false }) => {
  // Ne rien afficher si désactivé
  if (!enabled) return null;
  
  return (
    <div className="hidden">
      {/* Débogage de synchronisation désactivé */}
    </div>
  );
};

export default SyncDebugger;
