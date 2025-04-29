
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatusBadge } from './StatusBadge';

interface ConsistencyCheckProps {
  consistency: {
    status: string;
    is_consistent: boolean;
    message: string;
    differences?: {
      host?: { direct: string; loaded: string; };
      database?: { direct: string; loaded: string; };
      username?: { direct: string; loaded: string; };
    };
  };
}

export const ConsistencyCheck: React.FC<ConsistencyCheckProps> = ({ consistency }) => {
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Cohérence de la configuration</h3>
        <StatusBadge status={consistency.status} />
      </div>

      <div className="mb-4">
        <p>{consistency.message}</p>
      </div>

      {!consistency.is_consistent && consistency.differences && (
        <Alert className="mb-4">
          <AlertTitle>Différences détectées</AlertTitle>
          <AlertDescription>
            <ul className="space-y-2 mt-2">
              {consistency.differences.host && (
                <li>
                  <strong>Hôte:</strong>{" "}
                  <span className="text-red-500">
                    {consistency.differences.host.direct} ≠ {consistency.differences.host.loaded}
                  </span>
                </li>
              )}
              {consistency.differences.database && (
                <li>
                  <strong>Base de données:</strong>{" "}
                  <span className="text-red-500">
                    {consistency.differences.database.direct} ≠ {consistency.differences.database.loaded}
                  </span>
                </li>
              )}
              {consistency.differences.username && (
                <li>
                  <strong>Nom d'utilisateur:</strong>{" "}
                  <span className="text-red-500">
                    {consistency.differences.username.direct} ≠ {consistency.differences.username.loaded}
                  </span>
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
