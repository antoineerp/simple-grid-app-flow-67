
/**
 * Service de diagnostic pour le système de synchronisation
 */

import { toast } from '@/components/ui/use-toast';
import { syncRegistry } from './SyncRegistry';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

interface TableStatus {
  normalizedName: string;
  fullName: string;
  rawName: string;  // Nom brut d'origine
  tracked: boolean;
  hasLocalData: boolean;
  recordCount: number;
  lastSync: string | null;
  pendingSync: boolean;
}

interface SyncDiagnosticReport {
  tables: TableStatus[];
  totalTables: number;
  trackedTables: number;
  untrackedTables: number;
  tablesWithData: number;
  tablesWithPendingSync: number;
}

class SyncDiagnosticService {
  /**
   * Effectue un diagnostic complet du système de synchronisation
   */
  diagnoseSync(): SyncDiagnosticReport {
    console.log("=== DIAGNOSTIC DE SYNCHRONISATION ===");
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    const allKeys = Object.keys(localStorage);
    const report: SyncDiagnosticReport = {
      tables: [],
      totalTables: 0,
      trackedTables: 0,
      untrackedTables: 0,
      tablesWithData: 0,
      tablesWithPendingSync: 0
    };
    
    // Set pour stocker les noms de tables uniques détectés
    const uniqueTableNames = new Set<string>();
    
    // Analyser toutes les clés pour trouver les noms de tables
    allKeys.forEach(key => {
      // Ignorer les clés de système
      if (key.startsWith('_') || key.startsWith('last_') || 
          key.startsWith('sync_') || key.startsWith('auth_')) {
        return;
      }
      
      // Ajouter la clé brute comme une table potentielle
      uniqueTableNames.add(key);
    });
    
    // Analyser chaque table détectée
    uniqueTableNames.forEach(tableName => {
      const normalizedName = syncRegistry.normalizeTableName(tableName);
      const fullName = tableName; // Utiliser le nom complet tel quel
      const tableConfig = syncRegistry.getTable(normalizedName);
      
      // Vérifier si la table a des données
      const hasData = localStorage.getItem(tableName) !== null;
      let recordCount = 0;
      if (hasData) {
        try {
          const data = JSON.parse(localStorage.getItem(tableName) || '[]');
          recordCount = Array.isArray(data) ? data.length : 1;
        } catch (e) {
          console.error(`Erreur lors du parsing des données de ${tableName}:`, e);
        }
      }
      
      // Vérifier la dernière synchronisation
      const lastSync = localStorage.getItem(`last_synced_${normalizedName}`) || null;
      
      // Vérifier s'il y a une synchronisation en attente
      const pendingSync = localStorage.getItem(`sync_pending_${normalizedName}`) === 'true';
      
      // Ajouter le statut de la table au rapport
      const status: TableStatus = {
        normalizedName,
        fullName,
        rawName: tableName,
        tracked: tableConfig?.tracked || false,
        hasLocalData: hasData,
        recordCount,
        lastSync,
        pendingSync
      };
      
      report.tables.push(status);
      
      // Mettre à jour les compteurs
      report.totalTables++;
      if (status.tracked) report.trackedTables++;
      else report.untrackedTables++;
      if (status.hasLocalData) report.tablesWithData++;
      if (status.pendingSync) report.tablesWithPendingSync++;
    });
    
    // Ajouter également les tables connues sans données
    syncRegistry.getAllTables().forEach(tableConfig => {
      const normalizedName = tableConfig.tableName;
      if (!report.tables.find(t => t.normalizedName === normalizedName)) {
        const fullName = syncRegistry.getFullTableName(normalizedName, currentUser);
        report.tables.push({
          normalizedName,
          fullName,
          rawName: fullName,
          tracked: tableConfig.tracked,
          hasLocalData: false,
          recordCount: 0,
          lastSync: null,
          pendingSync: false
        });
        
        report.totalTables++;
        if (tableConfig.tracked) report.trackedTables++;
        else report.untrackedTables++;
      }
    });
    
    // Trier les tables par nom
    report.tables.sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
    
    return report;
  }
  
  /**
   * Active le suivi pour toutes les tables détectées
   */
  trackAllTables(): number {
    const report = this.diagnoseSync();
    let trackedCount = 0;
    
    report.tables.forEach(table => {
      if (!table.tracked) {
        try {
          // Utiliser le nom brut d'origine pour le suivi
          const success = syncRegistry.trackTable(table.rawName);
          if (success) {
            trackedCount++;
            console.log(`Table activée avec succès: ${table.rawName}`);
          } else {
            console.error(`Échec de l'activation de la table: ${table.rawName}`);
          }
        } catch (error) {
          console.error(`Erreur lors de l'activation de la table ${table.rawName}:`, error);
        }
      }
    });
    
    if (trackedCount > 0) {
      toast({
        title: "Tables activées",
        description: `${trackedCount} tables ont été mises sous suivi.`
      });
    }
    
    return trackedCount;
  }
  
  /**
   * Migre les données entre les tables (bibliotheque -> collaboration)
   */
  migrateOldTables(): Promise<boolean> {
    const currentUser = getDatabaseConnectionCurrentUser() || 'default';
    
    // Liste des migrations à effectuer
    const migrations: Array<[string, string]> = [
      ['bibliotheque', 'collaboration'],
      ['user_documents', 'documents']
    ];
    
    // Effectuer toutes les migrations en parallèle
    const migrationPromises = migrations.map(([oldTable, newTable]) => 
      syncRegistry.migrateTable(oldTable, newTable, currentUser)
    );
    
    return Promise.all(migrationPromises)
      .then(results => {
        const success = results.every(r => r);
        if (success) {
          toast({
            title: "Migration terminée",
            description: "Toutes les tables ont été migrées avec succès."
          });
        } else {
          toast({
            title: "Migration partielle",
            description: "Certaines tables n'ont pas pu être migrées.",
            variant: "destructive"
          });
        }
        return success;
      })
      .catch(error => {
        console.error("Erreur lors de la migration:", error);
        toast({
          title: "Erreur de migration",
          description: "Une erreur s'est produite lors de la migration des tables.",
          variant: "destructive"
        });
        return false;
      });
  }
  
  /**
   * Affiche le rapport de diagnostic
   */
  displayDiagnosticReport(): SyncDiagnosticReport {
    const report = this.diagnoseSync();
    
    console.log("=== RAPPORT DE DIAGNOSTIC DE SYNCHRONISATION ===");
    console.log(`Total des tables: ${report.totalTables}`);
    console.log(`Tables suivies: ${report.trackedTables}`);
    console.log(`Tables non suivies: ${report.untrackedTables}`);
    console.log(`Tables avec données: ${report.tablesWithData}`);
    console.log(`Tables avec sync en attente: ${report.tablesWithPendingSync}`);
    console.log("Détails des tables:");
    report.tables.forEach(table => {
      console.log(`- ${table.normalizedName} (${table.fullName}):`);
      console.log(`  Nom brut: ${table.rawName}`);
      console.log(`  Suivi: ${table.tracked ? 'Oui' : 'Non'}`);
      console.log(`  Données locales: ${table.hasLocalData ? `Oui (${table.recordCount} enregistrements)` : 'Non'}`);
      console.log(`  Dernière synchronisation: ${table.lastSync || 'Jamais'}`);
      console.log(`  Synchronisation en attente: ${table.pendingSync ? 'Oui' : 'Non'}`);
    });
    
    toast({
      title: "Diagnostic de synchronisation",
      description: `${report.trackedTables} tables suivies, ${report.untrackedTables} tables non suivies. Voir les détails dans la console.`
    });
    
    return report;
  }
}

export const syncDiagnostic = new SyncDiagnosticService();
export default syncDiagnostic;
