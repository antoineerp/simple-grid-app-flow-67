
import React, { useState, useEffect } from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';
import { getApiUrl, testApiConnection } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from 'lucide-react';

const Index = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [isRetesting, setIsRetesting] = useState<boolean>(false);
  
  const checkApi = async () => {
    try {
      setApiStatus('loading');
      const result = await testApiConnection();
      
      if (result.success) {
        setApiStatus('success');
        setApiMessage(result.message);
      } else {
        setApiStatus('error');
        setApiMessage(result.message);
      }
    } catch (error) {
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsRetesting(false);
    }
  };
  
  useEffect(() => {
    checkApi();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        
        {apiStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Connexion à l'API impossible: {apiMessage}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full" 
                onClick={() => {
                  setIsRetesting(true);
                  checkApi();
                }}
                disabled={isRetesting}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRetesting ? 'animate-spin' : ''}`} />
                {isRetesting ? 'Test en cours...' : 'Tester à nouveau'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Index;
