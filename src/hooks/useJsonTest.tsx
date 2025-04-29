
import { useState } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from "@/hooks/use-toast";
import { JsonTestResult } from '@/types/api-config';
import { validateJsonResponse, extractValidJson, parseFetchResponse } from '@/utils/jsonValidator';

export const useJsonTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const testJsonFormat = async (): Promise<JsonTestResult> => {
    try {
      setLoading(true);
      
      console.log("Démarrage du test JSON avec l'URL:", `${getApiUrl()}/simple-json-test.php`);
      
      const response = await fetch(`${getApiUrl()}/simple-json-test.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      console.log("Statut de la réponse:", response.status, response.statusText);
      
      // Analyser les en-têtes pour vérifier le content-type
      const contentType = response.headers.get('content-type');
      console.log("Content-Type:", contentType);
      
      if (contentType && !contentType.includes('application/json')) {
        console.warn(`Le Content-Type '${contentType}' ne correspond pas à 'application/json'`);
      }
      
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
          return { 
            success: true, 
            response: JSON.stringify(extractedData), 
            warning: "JSON extrait d'une réponse corrompue" 
          };
        }
        
        // Analyser l'erreur plus en détail pour donner des conseils utiles
        let errorDetails = error || "Format JSON invalide";
        let recommendation = "";
        
        if (text.includes('<br />') || text.includes('<b>')) {
          errorDetails = "La réponse contient des balises HTML (erreur PHP affichée)";
          recommendation = "Vérifiez les logs d'erreur PHP sur votre serveur et désactivez l'affichage des erreurs dans la production.";
        } else if (text.includes('<?php')) {
          errorDetails = "Le code PHP est affiché au lieu d'être exécuté";
          recommendation = "Vérifiez que le module PHP est correctement configuré sur votre serveur.";
        }
        
        toast({
          title: "Test JSON échoué",
          description: errorDetails,
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: errorDetails, 
          response: text,
          recommendation
        };
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
