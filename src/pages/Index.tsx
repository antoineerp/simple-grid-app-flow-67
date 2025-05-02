
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl } from '@/config/apiConfig';
import ConnectionDiagnostic from '@/components/diagnostics/ConnectionDiagnostic';

const Index = () => {
  React.useEffect(() => {
    console.log("Index page mounted");
    document.title = "Qualite.cloud - Connexion";
    
    // Vérifier que l'application est bien chargée
    console.log("Application React chargée correctement");
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Qualite.cloud</h1>
          <p className="text-gray-600">Système de Management de la Qualité</p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <div className="flex justify-between">
            <span>API: {getApiUrl()}</span>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-md mt-4">
        <ConnectionDiagnostic />
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Qualite.cloud - v1.1.0
      </div>
    </div>
  );
};

export default Index;
