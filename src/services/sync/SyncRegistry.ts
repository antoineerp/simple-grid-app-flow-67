
class SyncRegistryService {
  normalizeTableName(tableName: string): string {
    // Si c'est déjà un nom normalisé sans préfixe utilisateur, le retourner
    if (['documents', 'membres', 'collaboration', 'exigences', 'pilotage'].includes(tableName)) {
      return tableName;
    }
    
    // Gestion spéciale pour les groupes
    if (tableName.includes('_groups_')) {
      const baseParts = tableName.split('_groups_');
      return baseParts[0];
    }
    
    // Séparation du nom de la table et de l'identifiant utilisateur
    const parts = tableName.split('_');
    
    // Si le nom commence par user_, le retirer
    let baseName = parts[0] === 'user' ? parts[1] : parts[0];
    
    // Mappings spécifiques
    const mappings: Record<string, string> = {
      'exigence': 'exigences',
      'bibliotheque': 'collaboration',
      'user_documents': 'documents'
    };
    
    // Appliquer les mappings si nécessaire
    if (mappings[baseName]) {
      baseName = mappings[baseName];
    }
    
    return baseName.toLowerCase();
  }

  getEndpoint(tableName: string): string {
    const normalizedName = this.normalizeTableName(tableName);
    return `${normalizedName}-sync.php`;
  }

  isRegistered(tableName: string): boolean {
    // Vérifier si la table est déjà enregistrée
    const trackStatus = localStorage.getItem(`sync_track_${tableName}`);
    return trackStatus === 'true';
  }

  getFullTableName(tableName: string, userId: string): string {
    // Si le tableName contient déjà l'userId, ne pas le rajouter
    if (tableName.includes(userId)) {
      return tableName;
    }
    return `${tableName}_${userId}`;
  }

  getTable(tableName: string): { tableName: string; tracked: boolean } | undefined {
    // Normaliser le nom si nécessaire
    const normalizedName = this.normalizeTableName(tableName);
    
    // Vérifier si la table est déjà enregistrée
    const isTracked = this.isRegistered(tableName);
    
    return { tableName: normalizedName, tracked: isTracked };
  }

  getAllTables(): Array<{ tableName: string; tracked: boolean }> {
    // Retourne la liste des tables connues
    const knownTables = ['documents', 'membres', 'collaboration', 'exigences', 'pilotage'];
    
    // Chercher également toutes les tables dans localStorage qui seraient suivies
    const allKeys = Object.keys(localStorage);
    const trackedTableKeys = allKeys.filter(key => key.startsWith('sync_track_'));
    
    const result: Array<{ tableName: string; tracked: boolean }> = [];
    
    // Ajouter d'abord les tables connues
    knownTables.forEach(tableName => {
      result.push({
        tableName,
        tracked: this.isRegistered(tableName)
      });
    });
    
    // Puis ajouter les autres tables suivies
    trackedTableKeys.forEach(key => {
      const tableName = key.replace('sync_track_', '');
      const normalizedName = this.normalizeTableName(tableName);
      
      // Éviter les doublons
      if (!result.some(t => t.tableName === normalizedName)) {
        result.push({
          tableName: normalizedName,
          tracked: true
        });
      }
    });
    
    return result;
  }

  trackTable(tableName: string): boolean {
    try {
      // Activer le suivi de la table (utiliser le nom brut tel quel)
      localStorage.setItem(`sync_track_${tableName}`, 'true');
      console.log(`Table ${tableName} suivie avec succès`);
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de l'activation du suivi pour la table ${tableName}:`, error);
      return false;
    }
  }

  untrackTable(tableName: string): boolean {
    // Désactiver le suivi de la table
    localStorage.setItem(`sync_track_${tableName}`, 'false');
    console.log(`Table ${tableName} n'est plus suivie`);
    return true;
  }

  migrateTable(oldTable: string, newTable: string, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log(`Migration des données de ${oldTable} vers ${newTable} pour l'utilisateur ${userId}`);
        
        // Récupérer les données possibles avec différentes variantes de noms
        const possibleOldTables = [
          `${oldTable}_${userId}`,
          `user_${oldTable}_${userId}`,
          `${oldTable}`
        ];
        
        // Chercher la première variante qui existe
        let oldData = null;
        let sourceTable = '';
        
        for (const tableName of possibleOldTables) {
          const data = localStorage.getItem(tableName);
          if (data) {
            oldData = data;
            sourceTable = tableName;
            break;
          }
        }
        
        if (!oldData) {
          console.log(`Aucune donnée trouvée pour ${oldTable} (${possibleOldTables.join(', ')})`);
          resolve(true);
          return;
        }
        
        // Définir la nouvelle table
        const destTable = `${newTable}_${userId}`;
        
        // Stocker dans la nouvelle table
        localStorage.setItem(destTable, oldData);
        console.log(`Migration de ${sourceTable} vers ${destTable} terminée avec succès`);
        
        // Activer le suivi pour la nouvelle table
        this.trackTable(destTable);
        
        resolve(true);
      } catch (error) {
        console.error(`Erreur durant la migration de ${oldTable} vers ${newTable}:`, error);
        resolve(false);
      }
    });
  }
}

export const syncRegistry = new SyncRegistryService();

export const isTableTracked = (tableName: string): boolean => {
  return syncRegistry.isRegistered(tableName);
};
