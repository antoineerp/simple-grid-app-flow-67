
import React from 'react';
import { ConfigSection } from './ConfigSection';
import { ConsistencyCheck } from './ConsistencyCheck';
import { ServerInfo } from './ServerInfo';
import { DiagnosticResult } from '@/types/database-diagnostic';

interface DiagnosticSectionsProps {
  diagnosticResult: DiagnosticResult;
}

export const DiagnosticSections: React.FC<DiagnosticSectionsProps> = ({ diagnosticResult }) => {
  // Adapter le format des différences pour qu'il corresponde au format attendu
  const adaptedConsistency = {
    ...diagnosticResult.config_consistency,
    differences: diagnosticResult.config_consistency.differences ? {
      host: diagnosticResult.config_consistency.differences.host ? {
        direct: diagnosticResult.config_consistency.differences.host,
        loaded: diagnosticResult.config_consistency.differences.host
      } : undefined,
      database: diagnosticResult.config_consistency.differences.database ? {
        direct: diagnosticResult.config_consistency.differences.database,
        loaded: diagnosticResult.config_consistency.differences.database
      } : undefined,
      username: diagnosticResult.config_consistency.differences.username ? {
        direct: diagnosticResult.config_consistency.differences.username,
        loaded: diagnosticResult.config_consistency.differences.username
      } : undefined
    } : undefined
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfigSection
          title="Connexion PDO directe"
          status={diagnosticResult.pdo_direct.status}
          message={diagnosticResult.pdo_direct.message}
          config={diagnosticResult.pdo_direct.connection_info}
          error={diagnosticResult.pdo_direct.error}
        />
        
        <ConfigSection
          title="Classe Database"
          status={diagnosticResult.database_class.status}
          message={diagnosticResult.database_class.message}
          config={diagnosticResult.database_class.config}
          error={diagnosticResult.database_class.error}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <ConfigSection
          title="Fichier de configuration"
          status={diagnosticResult.config_file.status}
          message={diagnosticResult.config_file.message}
          config={diagnosticResult.config_file.config}
          error={diagnosticResult.config_file.error}
        />
        
        <ConsistencyCheck
          consistency={adaptedConsistency}
        />
      </div>
      
      <ServerInfo serverInfo={diagnosticResult.server_info} />
    </>
  );
};
