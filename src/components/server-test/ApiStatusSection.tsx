
import React from 'react';
import { Button } from "@/components/ui/button";
import { Server, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ApiStatusSectionProps {
  apiStatus: 'idle' | 'loading' | 'success' | 'error';
  apiMessage: string;
  onTest: () => void;
}

const ApiStatusSection: React.FC<ApiStatusSectionProps> = ({
  apiStatus,
  apiMessage,
  onTest
}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium flex items-center">
        <Server className="h-4 w-4 mr-2" />
        Connexion à l'API:
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onTest}
        disabled={apiStatus === 'loading'}
      >
        {apiStatus === 'loading' ? 'Test en cours...' : 'Tester'}
      </Button>
    </div>
    {apiStatus !== 'idle' && (
      <Alert variant={apiStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
        <div className="flex items-start">
          {apiStatus === 'success'
            ? <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
            : <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />}
          <div>
            <AlertTitle>{apiStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
            <AlertDescription>{apiMessage}</AlertDescription>
          </div>
        </div>
      </Alert>
    )}
  </div>
);

export default ApiStatusSection;
