
import React from 'react';
import ApiDiagnostic from '@/components/diagnostic/ApiDiagnostic';

const DiagnosticPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Diagnostic du système</h1>
      <ApiDiagnostic />
    </div>
  );
};

export default DiagnosticPage;
