
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from './StatusBadge';

interface ConfigSectionProps {
  title: string;
  status: string;
  message: string;
  config?: {
    host: string;
    db_name?: string;
    database?: string;
    username?: string;
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
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium">{title}</h3>
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={status} />
        <span>{message}</span>
      </div>
      {config && (
        <div className="text-sm space-y-1">
          <div><strong>Hôte:</strong> {config.host}</div>
          <div><strong>Base:</strong> {config.db_name || config.database}</div>
          {config.username && <div><strong>Utilisateur:</strong> {config.username}</div>}
          {config.source && <div><strong>Source:</strong> {config.source}</div>}
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
