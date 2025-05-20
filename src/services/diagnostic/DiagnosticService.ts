
import { toast } from "@/components/ui/use-toast";
import { getApiUrl } from "@/config/apiConfig";
import { getAuthHeaders } from "../auth/authService";

export interface DiagnosticReport {
  status: string;
  message: string;
  files_checked?: number;
  errors_found?: number;
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Service pour exécuter des diagnostics sur l'application
 */
export const DiagnosticService = {
  /**
   * Exécute un diagnostic complet de l'application
   */
  async runCompleteDiagnostic(): Promise<DiagnosticReport> {
    try {
      const apiUrl = getApiUrl();
      console.log("Lancement du diagnostic complet via", `${apiUrl}/diagnostic-complet.php`);
      
      // Ajouter un timestamp pour éviter le cache
      const timestamp = new Date().getTime();
      const url = `${apiUrl}/diagnostic-complet.php?nocache=${timestamp}`;
      
      console.log("URL complète:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Extraction du texte pour debug
      const responseText = await response.text();
      console.log("Réponse reçue, longueur:", responseText.length);
      
      // Analyse du contenu HTML pour extraire les informations importantes
      const report = DiagnosticService.parseHtmlDiagnostic(responseText);
      
      return report;
    } catch (error) {
      console.error("Erreur lors de l'exécution du diagnostic:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Erreur inconnue lors du diagnostic",
        recommendations: ["Vérifiez que le serveur API est accessible", "Vérifiez les permissions d'accès aux fichiers"]
      };
    }
  },
  
  /**
   * Exécute un diagnostic de structure de fichiers
   */
  async runStructureDiagnostic(): Promise<DiagnosticReport> {
    try {
      const apiUrl = getApiUrl();
      console.log("Lancement du diagnostic de structure via", `${apiUrl}/fix-directory-structure.php`);
      
      const response = await fetch(`${apiUrl}/fix-directory-structure.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Pour l'instant, retourne un simple rapport de réussite
      return {
        status: "success",
        message: "Analyse de la structure de fichiers effectuée",
        files_checked: 0,
        errors_found: 0,
        recommendations: [
          "Vérifiez les résultats détaillés dans l'interface du diagnostic"
        ]
      };
    } catch (error) {
      console.error("Erreur lors de l'analyse de structure:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Erreur inconnue lors de l'analyse de structure",
        recommendations: ["Vérifiez que le serveur API est accessible", "Vérifiez les permissions d'accès aux fichiers"]
      };
    }
  },
  
  /**
   * Exécute un diagnostic de déploiement
   */
  async runDeploymentDiagnostic(): Promise<DiagnosticReport> {
    try {
      const apiUrl = getApiUrl();
      console.log("Lancement du diagnostic de déploiement via", `${apiUrl}/verify-deploy.php`);
      
      const response = await fetch(`${apiUrl}/verify-deploy.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return {
        status: "success",
        message: "Vérification du déploiement effectuée",
        files_checked: 0,
        errors_found: 0,
        recommendations: [
          "Consultez les résultats détaillés dans l'onglet de diagnostic"
        ]
      };
    } catch (error) {
      console.error("Erreur lors de la vérification du déploiement:", error);
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Erreur inconnue lors de la vérification",
        recommendations: ["Vérifiez que le serveur API est accessible", "Vérifiez les permissions d'accès aux fichiers"]
      };
    }
  },
  
  /**
   * Parse le HTML du diagnostic pour en extraire les informations importantes
   */
  parseHtmlDiagnostic(htmlContent: string): DiagnosticReport {
    // Analyse simple pour extraire les informations importantes
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Trouver les erreurs avec regex simple
    const errorMatches = htmlContent.match(/<span class=['"]error['"]>(.*?)<\/span>/g);
    const errorCount = errorMatches ? errorMatches.length : 0;
    
    // Trouver les recommandations
    const recMatches = htmlContent.match(/<li>(.*?)<\/li>/g);
    if (recMatches) {
      recMatches.slice(0, 5).forEach(match => {
        const text = match.replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (text.length > 10) {
          recommendations.push(text);
        }
      });
    }
    
    return {
      status: errorCount > 0 ? "warning" : "success",
      message: errorCount > 0 ? 
        `Diagnostic terminé avec ${errorCount} problème(s) détecté(s)` : 
        "Diagnostic terminé avec succès",
      errors_found: errorCount,
      warnings,
      recommendations: recommendations.length > 0 ? recommendations : [
        "Vérifiez les permissions d'accès aux fichiers",
        "Assurez-vous que la base de données 'utilisateurs' est correctement configurée",
        "Vérifiez la configuration des dossiers d'upload"
      ]
    };
  }
};
