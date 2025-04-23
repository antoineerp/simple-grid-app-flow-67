
import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import type { DatabaseInfo, DatabaseResponse } from './types';

export const validateJsonResponse = (responseText: string): any => {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Erreur d'analyse JSON:", e);
    
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error("Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.");
    }
    
    throw new Error(`Erreur d'analyse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  toast({
    title,
    description,
    variant,
  });
};

export const getBaseUrl = () => getApiUrl();

export const formatDatabaseInfo = (data: DatabaseResponse['info']): DatabaseInfo => ({
  host: data?.host || "Hôte inconnu",
  database: data?.database_name || "Base de données inconnue",
  size: data?.size || "Taille inconnue",
  tables: data?.table_count || 0,
  lastBackup: data?.last_backup || "N/A",
  status: "Online",
  encoding: data?.encoding || "UTF-8",
  collation: data?.collation || "N/A",
  tableList: data?.tables || []
});
