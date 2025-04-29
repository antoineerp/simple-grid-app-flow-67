
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from './StatusBadge';

interface ConsistencyCheckProps {
  consistency: {
    status: string;
    is_consistent: boolean;
    message: string;
    differences?: {
      host?: string;
      database?: string;
      username?: string;
    };
  };
}

export const ConsistencyCheck: React.FC<ConsistencyCheckProps> = ({ consistency }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium">Cohérence des configurations</h3>
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={consistency.status} />
        <span>{consistency.message}</span>
      </div>
      {consistency.differences && (
        <Alert variant="destructive" className="mt-2">
          <div className="text-sm space-y-1">
            {consistency.differences.host && (
              <div><strong>Hôte:</strong> {consistency.differences.host}</div>
            )}
            {consistency.differences.database && (
              <div><strong>Base:</strong> {consistency.differences.database}</div>
            )}
            {consistency.differences.username && (
              <div><strong>Utilisateur:</strong> {consistency.differences.username}</div>
            )}
          </div>
        </Alert>
      )}
    </div>
  );
};
