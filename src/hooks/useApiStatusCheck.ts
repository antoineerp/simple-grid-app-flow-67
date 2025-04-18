
import { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/apiConfig';

export const useApiStatusCheck = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'error'>('checking');
  const [apiMessage, setApiMessage] = useState<string>('');

  const checkApiStatus = async () => {
    try {
      const cacheBuster = new Date().getTime();
      const response = await fetch(`${getApiUrl()}/test.php?_=${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (response.ok && data && data.status === 200) {
        setApiStatus('available');
        setApiMessage(data.message || 'API disponible');
        console.log("API disponible:", data);
      } else {
        setApiStatus('error');
        setApiMessage(data?.message || `Erreur API: ${response.status}`);
        console.error("API non disponible, code:", response.status, data);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur de connexion');
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  const retestApi = async () => {
    setApiStatus('checking');
    setApiMessage('Vérification en cours...');
    await checkApiStatus();
  };

  return { apiStatus, apiMessage, retestApi };
};
