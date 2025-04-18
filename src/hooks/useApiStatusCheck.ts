
import { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

export const useApiStatusCheck = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'error' | 'php-error'>('checking');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [phpInfo, setPhpInfo] = useState<any>(null);

  const checkApiStatus = async () => {
    try {
      const cacheBuster = new Date().getTime();
      
      // Test avec php-test.php d'abord pour vérifier l'interprétation PHP
      const phpTestResponse = await fetch(`${getApiUrl()}/php-test.php?_=${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      // Vérifier si la réponse est PHP brut ou JSON
      const contentType = phpTestResponse.headers.get('Content-Type') || '';
      const responseText = await phpTestResponse.text();
      
      // Si la réponse commence par <?php, cela signifie que PHP n'est pas interprété
      if (responseText.trim().startsWith('<?php')) {
        setApiStatus('php-error');
        setApiMessage('PHP n\'est pas correctement interprété par le serveur');
        console.error("PHP n'est pas interprété:", responseText.substring(0, 200));
        
        // Afficher un toast avec des instructions utiles
        toast({
          title: "Erreur de configuration PHP",
          description: "Le serveur ne traite pas les fichiers PHP correctement. Vérifiez la configuration du serveur.",
          variant: "destructive",
        });
        return;
      }
      
      // Essayer de parser la réponse JSON
      let phpData;
      try {
        phpData = JSON.parse(responseText);
        setPhpInfo(phpData.data);
        console.log("Informations PHP:", phpData);
      } catch (parseError) {
        setApiStatus('php-error');
        setApiMessage('Réponse du serveur PHP non valide');
        console.error("Erreur de parsing PHP:", parseError);
        return;
      }
      
      // Si tout fonctionne, essayer maintenant test.php normal
      const response = await fetch(`${getApiUrl()}/test.php?_=${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      const apiResponseText = await response.text();
      let data;
      
      // Vérifier si la réponse contient du code PHP
      if (apiResponseText.trim().startsWith('<?php')) {
        setApiStatus('php-error');
        setApiMessage('API test.php: PHP n\'est pas correctement interprété');
        console.error("L'API renvoie du code PHP brut:", apiResponseText.substring(0, 200));
        return;
      }
      
      try {
        data = JSON.parse(apiResponseText);
      } catch (error) {
        setApiStatus('error');
        setApiMessage('Format de réponse API invalide');
        console.error("Erreur de parsing API:", error);
        return;
      }
      
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

  return { apiStatus, apiMessage, phpInfo, retestApi };
};
