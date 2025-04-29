
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from './StatusBadge';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ConfigSectionProps {
  title: string;
  status: string;
  message: string;
  config?: {
    host?: string;
    db_name?: string;
    database?: string;
    username?: string;
    user?: string;
    source?: string;
  };
  error?: string;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({ 
  title, 
  status, 
  message, 
  config, 
  error 
}) => {
  const isSuccess = status.toLowerCase() === 'success';
  
  return (
    <div className="p-4 border rounded-lg bg-background shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <StatusBadge status={status} />
      </div>
      
      <Alert variant={isSuccess ? "default" : "destructive"} className="mb-3">
        <div className="flex items-start">
          {isSuccess ? 
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" /> : 
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
          }
          <AlertDescription>{message}</AlertDescription>
        </div>
      </Alert>
      
      {config && (
        <div className="mt-2 space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">Configuration</h4>
          <div className="bg-muted p-3 rounded text-sm">
            {config.host && (
              <div className="grid grid-cols-2 border-b py-1">
                <span className="font-medium">Host:</span>
                <span className="font-mono">{config.host}</span>
              </div>
            )}
            {(config.database || config.db_name) && (
              <div className="grid grid-cols-2 border-b py-1">
                <span className="font-medium">Base de données:</span>
                <span className="font-mono">{config.database || config.db_name}</span>
              </div>
            )}
            {(config.username || config.user) && (
              <div className="grid grid-cols-2 border-b py-1">
                <span className="font-medium">Utilisateur:</span>
                <span className="font-mono">{config.username || config.user}</span>
              </div>
            )}
            {config.source && (
              <div className="grid grid-cols-2 py-1">
                <span className="font-medium">Source:</span>
                <span>{config.source}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-muted-foreground">Message d'erreur</h4>
          <div className="bg-red-50 text-red-900 border border-red-200 p-3 rounded text-sm font-mono whitespace-pre-wrap">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};
