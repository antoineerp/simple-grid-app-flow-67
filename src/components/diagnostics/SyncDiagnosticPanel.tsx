
import React from 'react';

interface SyncDiagnosticPanelProps {
  onForceSync?: () => Promise<void>;
  [key: string]: any; // Accept any additional props
}

// Composant invisible pour respecter la demande de masquer les informations de synchronisation
const SyncDiagnosticPanel: React.FC<SyncDiagnosticPanelProps> = () => {
  return null;
};

export default SyncDiagnosticPanel;
