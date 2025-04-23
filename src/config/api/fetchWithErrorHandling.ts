
/**
 * Fonction utilitaire pour les requêtes fetch avec gestion d'erreur intelligente
 */
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
  try {
    console.log(`Requête vers: ${url}`, options);
    const response = await fetch(url, options);

    console.log(`Réponse reçue: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = `Erreur HTTP: ${response.status}`;

      if (responseText.trim().startsWith('<?php')) {
        console.error('Code PHP non exécuté détecté');
        throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur.');
      }
      
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Réponse HTML reçue au lieu de JSON');
        throw new Error('Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration.');
      }
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        errorMessage = `Erreur: ${responseText.substring(0, 100)}...`;
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) return {};

    if (text.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté');
      throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur.');
    }
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('Réponse HTML reçue au lieu de JSON');
      throw new Error('Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration.');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e);
      console.error("Texte reçu:", text.substring(0, 300));
      throw new Error(`Réponse invalide: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Erreur lors de la requête:", error);
    throw error;
  }
}
