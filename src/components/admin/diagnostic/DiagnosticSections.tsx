
import React from 'react';
import { ConfigSection } from './ConfigSection';
import { ConsistencyCheck } from './ConsistencyCheck';
import { ServerInfo } from './ServerInfo';
import { DiagnosticResult } from '@/types/database-diagnostic';

interface DiagnosticSectionsProps {
  diagnosticResult: DiagnosticResult;
}

export const DiagnosticSections: React.FC<DiagnosticSectionsProps> = ({ diagnosticResult }) => (
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
        consistency={diagnosticResult.config_consistency}
      />
    </div>
    
    <ServerInfo serverInfo={diagnosticResult.server_info} />
  </>
);
