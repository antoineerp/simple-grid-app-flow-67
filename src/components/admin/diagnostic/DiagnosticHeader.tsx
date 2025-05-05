
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from 'lucide-react';

interface DiagnosticHeaderProps {
  loading: boolean;
  error?: string | null;
  onRun: () => void;
}

export const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({ loading, error, onRun }) => (
  <div className="flex flex-row items-center justify-between">
    <div>
      <h2 className="text-xl font-bold">Diagnostic de la base de données</h2>
      <p className="text-muted-foreground">
        Analyse complète de la configuration et des connexions à la base de données
      </p>
      {error && (
        <div className="mt-2 flex items-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
    <Button onClick={onRun} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      Exécuter le diagnostic
    </Button>
  </div>
);
