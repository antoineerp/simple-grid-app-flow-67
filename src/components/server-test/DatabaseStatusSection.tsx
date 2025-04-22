
import React from 'react';
import { Button } from "@/components/ui/button";
import { Database, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface DatabaseStatusSectionProps {
  dbStatus: 'idle' | 'loading' | 'success' | 'error';
  dbMessage: string;
  onTest: () => void;
}

const DatabaseStatusSection: React.FC<DatabaseStatusSectionProps> = ({
  dbStatus,
  dbMessage,
  onTest,
}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium flex items-center">
        <Database className="h-4 w-4 mr-2" />
        Connexion à la base de données:
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onTest}
        disabled={dbStatus === 'loading'}
      >
        {dbStatus === 'loading' ? 'Test en cours...' : 'Tester'}
      </Button>
    </div>
    {dbStatus !== 'idle' && (
      <Alert variant={dbStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
        <div className="flex items-start">
          {dbStatus === 'success'
            ? <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
            : <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />}
          <div>
            <AlertTitle>{dbStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
            <AlertDescription>{dbMessage}</AlertDescription>
          </div>
        </div>
      </Alert>
    )}
  </div>
);

export default DatabaseStatusSection;
