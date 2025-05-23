
import React from 'react';
import DatabaseDiagnostic from '@/components/DatabaseDiagnostic';

const Diagnostic: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Diagnostic de l'application</h1>
      <DatabaseDiagnostic />
    </div>
  );
};

export default Diagnostic;
