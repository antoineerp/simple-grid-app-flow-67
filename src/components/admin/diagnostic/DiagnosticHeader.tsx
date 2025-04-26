
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface DiagnosticHeaderProps {
  loading: boolean;
  onRun: () => void;
}

export const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({ loading, onRun }) => (
  <div className="flex flex-row items-center justify-between">
    <div>
      <h2 className="text-xl font-bold">Diagnostic de la base de données</h2>
      <p className="text-muted-foreground">
        Analyse complète de la configuration et des connexions à la base de données
      </p>
    </div>
    <Button onClick={onRun} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      Exécuter le diagnostic
    </Button>
  </div>
);
