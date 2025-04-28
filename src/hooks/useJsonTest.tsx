
import { useState } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from "@/hooks/use-toast";
import { JsonTestResult } from '@/types/api-config';
import { validateJsonResponse, extractValidJson } from '@/utils/jsonValidator';

export const useJsonTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testJsonFormat = async (): Promise<JsonTestResult> => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/simple-json-test.php`);
      const text = await response.text();
      
      console.log("Réponse brute du test JSON:", text.substring(0, 300));
      
      // Analyser la réponse avec notre utilitaire
      const { isValid, data, error } = validateJsonResponse(text);
      
      if (isValid) {
        toast({
          title: "Test JSON réussi",
          description: "Le serveur répond avec du JSON valide",
        });
        return { success: true, response: text };
      } else {
        // Essayer d'extraire un JSON valide si possible
        const { extracted, data: extractedData } = extractValidJson(text);
        
        if (extracted) {
          toast({
            title: "Test JSON partiellement réussi",
            description: "JSON valide extrait d'une réponse partiellement corrompue",
            variant: "default",
          });
          return { success: true, response: JSON.stringify(extractedData), warning: "JSON extrait d'une réponse corrompue" };
        }
        
        toast({
          title: "Test JSON échoué",
          description: error || "Le serveur ne répond pas avec du JSON valide",
          variant: "destructive",
        });
        return { success: false, error: error || "Format JSON invalide", response: text };
      }
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
