
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSyncContext } from '@/contexts/SyncContext';
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SyncDiagnosticPanelProps {
  onForceSync?: () => Promise<void>;
}

// Composant invisible pour respecter la demande de masquer les informations de synchronisation
const SyncDiagnosticPanel: React.FC<SyncDiagnosticPanelProps> = () => {
  return null;
};

export default SyncDiagnosticPanel;
