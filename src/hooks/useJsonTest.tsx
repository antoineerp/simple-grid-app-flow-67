
import { useState } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from "@/hooks/use-toast";
import { JsonTestResult } from '@/types/api-config';

export const useJsonTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testJsonFormat = async (): Promise<JsonTestResult> => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/simple-json-test.php`);
      const text = await response.text();
      
      console.log("Réponse brute du test JSON:", text.substring(0, 300));
      
      try {
        JSON.parse(text);
        toast({
          title: "Test JSON réussi",
          description: "Le serveur répond avec du JSON valide",
        });
      } catch (e) {
        console.error("Erreur de parsing JSON:", e);
        toast({
          title: "Test JSON échoué",
          description: "Le serveur ne répond pas avec du JSON valide",
          variant: "destructive",
        });
      }
      
      return { success: true, response: text };
    } catch (error) {
      console.error("Erreur de test JSON:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Impossible de contacter le serveur",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    testJsonFormat
  };
};
