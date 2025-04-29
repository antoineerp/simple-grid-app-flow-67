
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle } from 'lucide-react';

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
    <div className="p-4 border rounded-lg bg-background shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Cohérence des configurations</h3>
      
      <Alert variant={consistency.is_consistent ? "default" : "destructive"}>
        <div className="flex items-start">
          {consistency.is_consistent ? 
            <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500" /> :
            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
          }
          <div>
            <AlertTitle>
              {consistency.is_consistent ? "Cohérence validée" : "Incohérences détectées"}
            </AlertTitle>
            <AlertDescription>
              {consistency.message}
            </AlertDescription>
          </div>
        </div>
      </Alert>
      
      {!consistency.is_consistent && consistency.differences && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Différences détectées:</h4>
          
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Paramètre</th>
                <th className="border p-2 text-left">Configuration directe</th>
                <th className="border p-2 text-left">Configuration chargée</th>
              </tr>
            </thead>
            <tbody>
              {consistency.differences.host && (
                <tr>
                  <td className="border p-2 font-medium">Host</td>
                  <td className="border p-2">{consistency.differences.host.direct}</td>
                  <td className="border p-2">{consistency.differences.host.loaded}</td>
                </tr>
              )}
              {consistency.differences.database && (
                <tr>
                  <td className="border p-2 font-medium">Base de données</td>
                  <td className="border p-2">{consistency.differences.database.direct}</td>
                  <td className="border p-2">{consistency.differences.database.loaded}</td>
                </tr>
              )}
              {consistency.differences.username && (
                <tr>
                  <td className="border p-2 font-medium">Utilisateur</td>
                  <td className="border p-2">{consistency.differences.username.direct}</td>
                  <td className="border p-2">{consistency.differences.username.loaded}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
