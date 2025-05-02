
/**
 * Registre centralisé des tables à synchroniser
 * Ce service gère l'enregistrement et le suivi des tables dans l'application
 */

import { toast } from '@/components/ui/use-toast';

// Types pour le registre de synchronisation
export interface SyncTableConfig {
  tableName: string;         // Nom de base de la table
  displayName: string;       // Nom à afficher dans l'interface
  userSpecific: boolean;     // Si la table est spécifique à l'utilisateur
  priority: number;          // Priorité de synchronisation (plus bas = plus prioritaire)
  dependencies?: string[];   // Tables qui doivent être synchronisées avant celle-ci
  tracked: boolean;          // Si la table est actuellement suivie
}

// Liste des tables principales du système
const CORE_TABLES: SyncTableConfig[] = [
  { 
    tableName: 'documents', 
    displayName: 'Documents', 
    userSpecific: true, 
    priority: 1,
    tracked: true
  },
  { 
    tableName: 'exigences', 
    displayName: 'Exigences', 
    userSpecific: true, 
    priority: 2,
    tracked: true
  },
  { 
    tableName: 'membres', 
    displayName: 'Membres', 
    userSpecific: true, 
    priority: 1,
    tracked: true
  },
  { 
    tableName: 'collaboration', 
    displayName: 'Collaboration', 
    userSpecific: true, 
    priority: 3,
    tracked: true,
    dependencies: ['documents']
  },
  { 
    tableName: 'exigence_groups', 
    displayName: 'Groupes d\'exigences', 
    userSpecific: true, 
    priority: 2,
    tracked: true,
    dependencies: ['exigences']
  },
  { 
    tableName: 'pilotage', 
    displayName: 'Pilotage', 
    userSpecific: true, 
    priority: 4,
    tracked: true,
    dependencies: ['documents', 'exigences']
  },
  { 
    tableName: 'indicateurs', 
    displayName: 'Indicateurs', 
    userSpecific: false, 
    priority: 5,
    tracked: true
  },
  { 
    tableName: 'utilisateurs', 
    displayName: 'Utilisateurs', 
    userSpecific: false, 
    priority: 0,
    tracked: true
  },
  { 
    tableName: 'ressources_humaines', 
    displayName: 'Ressources Humaines', 
    userSpecific: false, 
    priority: 5,
    tracked: true
  }
];

// Le registre des tables
class SyncRegistry {
  private tables: Map<string, SyncTableConfig> = new Map();
  private legacyMappings: Map<string, string> = new Map();
  
  constructor() {
    // Initialiser avec les tables principales
    CORE_TABLES.forEach(table => {
      this.tables.set(table.tableName, table);
    });
    
    // Initialiser avec les mappages de legacy
    this.initLegacyMappings();
  }
  
  // Initialise les mappages pour les anciens noms de tables
  private initLegacyMappings(): void {
    // Mapper 'bibliotheque' vers 'collaboration' (nouveau nom)
    this.legacyMappings.set('bibliotheque', 'collaboration');
    
    // Ajouter d'autres mappages si nécessaire
    this.legacyMappings.set('user_documents', 'documents');
    this.legacyMappings.set('user_document_groups', 'document_groups');
  }
  
  // Récupère toutes les tables enregistrées
  getAllTables(): SyncTableConfig[] {
    return Array.from(this.tables.values());
  }
  
  // Récupère les tables qui doivent être suivies
  getTrackedTables(): SyncTableConfig[] {
    return Array.from(this.tables.values()).filter(table => table.tracked);
  }
  
  // Récupère une table par son nom
  getTable(tableName: string): SyncTableConfig | undefined {
    // Vérifier d'abord le nom direct
    if (this.tables.has(tableName)) {
      return this.tables.get(tableName);
    }
    
    // Vérifier ensuite les mappages legacy
    const mappedName = this.legacyMappings.get(tableName);
    if (mappedName && this.tables.has(mappedName)) {
      return this.tables.get(mappedName);
    }
    
    return undefined;
  }
  
  // Normalise un nom de table (retire les préfixes/suffixes utilisateur)
  normalizeTableName(fullTableName: string): string {
    // Retirer les suffixes utilisateur (p71x6d_system, etc.)
    const baseTable = fullTableName.replace(/_[^_]+$/, '');
    
    // Vérifier si c'est un nom legacy
    if (this.legacyMappings.has(baseTable)) {
      return this.legacyMappings.get(baseTable) as string;
    }
    
    return baseTable;
  }
  
  // Détermine le nom complet de la table pour un utilisateur donné
  getFullTableName(tableName: string, userId: string): string {
    const tableConfig = this.getTable(tableName);
    
    if (!tableConfig) {
      console.warn(`Table non reconnue: ${tableName}`);
      return tableName;
    }
    
    if (tableConfig.userSpecific && userId) {
      return `${tableName}_${userId}`;
    }
    
    return tableName;
  }
  
  // Enregistre une nouvelle table ou met à jour une existante
  registerTable(config: SyncTableConfig): void {
    this.tables.set(config.tableName, config);
    console.log(`Table enregistrée: ${config.tableName}`);
  }
  
  // Active le suivi d'une table
  trackTable(tableName: string): boolean {
    const normalizedName = this.normalizeTableName(tableName);
    const table = this.getTable(normalizedName);
    
    if (table) {
      table.tracked = true;
      console.log(`Suivi activé pour la table: ${normalizedName}`);
      return true;
    } else {
      // Table inconnue, l'enregistrer avec des valeurs par défaut
      this.registerTable({
        tableName: normalizedName,
        displayName: normalizedName,
        userSpecific: tableName.includes('_'),
        priority: 10, // Priorité basse par défaut
        tracked: true
      });
      console.log(`Nouvelle table enregistrée et suivie: ${normalizedName}`);
      return true;
    }
    
    return false;
  }
  
  // Désactive le suivi d'une table
  untrackTable(tableName: string): boolean {
    const normalizedName = this.normalizeTableName(tableName);
    const table = this.getTable(normalizedName);
    
    if (table) {
      table.tracked = false;
      console.log(`Suivi désactivé pour la table: ${normalizedName}`);
      return true;
    }
    
    return false;
  }
  
  // Migre les données d'une ancienne table vers une nouvelle
  async migrateTable(oldTableName: string, newTableName: string, userId: string): Promise<boolean> {
    try {
      const oldFullName = oldTableName.includes('_') ? oldTableName : `${oldTableName}_${userId}`;
      const newFullName = this.getFullTableName(newTableName, userId);
      
      // Récupérer les données de l'ancienne table
      const oldData = localStorage.getItem(oldFullName);
      if (!oldData) {
        console.log(`Aucune donnée à migrer depuis ${oldFullName}`);
        return true;
      }
      
      // Sauvegarder dans la nouvelle table
      localStorage.setItem(newFullName, oldData);
      console.log(`Migration réussie de ${oldFullName} vers ${newFullName}`);
      
      // Notifier l'utilisateur
      toast({
        title: "Migration de données",
        description: `Les données de ${oldTableName} ont été migrées vers ${newTableName}`,
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la migration de ${oldTableName} vers ${newTableName}:`, error);
      return false;
    }
  }
}

// Instance unique du registre
export const syncRegistry = new SyncRegistry();

// Fonction d'aide pour vérifier si une table est suivie
export const isTableTracked = (tableName: string): boolean => {
  const table = syncRegistry.getTable(syncRegistry.normalizeTableName(tableName));
  return table?.tracked || false;
};

// Export par défaut
export default syncRegistry;
