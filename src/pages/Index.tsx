
import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { testApiConnection } from '@/config/apiConfig';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [version, setVersion] = useState<string>('1.0.8');
  
  const checkApi = async () => {
    try {
      console.log("Checking API connection...");
      setApiStatus('loading');
      const result = await testApiConnection();
      
      console.log("API connection result:", result);
      if (result && result.success) {
        setApiStatus('success');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error("API connection error:", error);
      setApiStatus('error');
    }
  };
  
  useEffect(() => {
    console.log("Index component mounted");
    checkApi();
    setVersion(`1.0.9 - ${new Date().toLocaleDateString()}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        
        {apiStatus === 'loading' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
            Vérification de la connexion à l'API...
          </div>
        )}
        
        {apiStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            Connexion à l'API impossible. Veuillez contacter le support technique.
          </div>
        )}
        
        <LoginForm />
        
        <div className="mt-4 text-sm text-gray-500 border-t pt-4">
          <p>Identifiants de test:</p>
          <p>Utilisateur: <strong>admin</strong> - Mot de passe: <strong>admin123</strong></p>
          <p>Utilisateur: <strong>p71x6d_system</strong> - Mot de passe: <strong>Trottinette43!</strong></p>
          <p>Utilisateur: <strong>p71x6d_dupont</strong> - Mot de passe: <strong>manager456</strong></p>
          <p>Utilisateur: <strong>p71x6d_martin</strong> - Mot de passe: <strong>user789</strong></p>
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Version: {version}
      </div>
    </div>
  );
};

export default Index;
