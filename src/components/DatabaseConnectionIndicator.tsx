
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react";
import { useDatabaseConnection } from '@/services/dbConnection';
import { Badge } from "@/components/ui/badge";

interface DatabaseConnectionIndicatorProps {
  autoCheck?: boolean;
  showDetails?: boolean;
}

const DatabaseConnectionIndicator: React.FC<DatabaseConnectionIndicatorProps> = ({
  autoCheck = true,
  showDetails = false
}) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'idle'>('idle');
  const [details, setDetails] = useState<any>(null);
  const { testConnection } = useDatabaseConnection();
  
  const checkConnection = async () => {
    setStatus('checking');
    
    try {
      const result = await testConnection(false);
      
      if (result.status === 'success') {
        setStatus('connected');
      } else {
        setStatus('error');
      }
      
      setDetails(result);
    } catch (error) {
      setStatus('error');
      setDetails({ error: error instanceof Error ? error.message : String(error) });
    }
  };
  
  useEffect(() => {
    if (autoCheck) {
      checkConnection();
    }
  }, [autoCheck]);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={status === 'connected' ? "default" : "destructive"} className="flex gap-1 items-center">
          {status === 'checking' ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : status === 'connected' ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span>
            {status === 'checking' ? 'Vérification...' : 
             status === 'connected' ? 'Connecté' : 
             status === 'error' ? 'Erreur' : 'Non vérifié'}
          </span>
        </Badge>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={checkConnection}
          disabled={status === 'checking'}
          className="h-7 px-2 flex items-center gap-1"
        >
          {status === 'checking' ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Database className="h-3 w-3" />
          )}
          <span>Vérifier</span>
        </Button>
      </div>
      
      {showDetails && details && (
        <div className="text-xs">
          {status === 'connected' ? (
            <Alert variant="default" className="py-2">
              <AlertDescription className="text-xs">
                Connecté à {details.database?.name} sur {details.database?.host}
                {details.database?.tables_count !== undefined && (
                  <div>Tables: {details.database.tables_count}</div>
                )}
                {details.database?.mysql_version && (
                  <div>MySQL: {details.database.mysql_version}</div>
                )}
              </AlertDescription>
            </Alert>
          ) : status === 'error' && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {details.message || "Erreur de connexion"}
                {details.error && <div className="font-mono mt-1">{details.error}</div>}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionIndicator;
