
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SyncDebuggerProps {
  enabled?: boolean;
}

const SyncDebugger: React.FC<SyncDebuggerProps> = ({ enabled = false }) => {
  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50 bg-background border shadow-md rounded-lg p-3">
      <Alert>
        <AlertTitle>Débogage de synchronisation</AlertTitle>
        <AlertDescription>
          Mode débogage actif. Les informations de synchronisation apparaîtront ici.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SyncDebugger;
