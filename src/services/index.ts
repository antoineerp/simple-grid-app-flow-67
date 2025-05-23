
// Index de tous les services de l'application
// Ce fichier centralise les exports pour faciliter les imports

// Exporter le service API principal
export * from './api/apiService';

// Réexporter les services existants
export * from './users/userService';
export * from './auth/authService';

// Note: Ces services seront progressivement migrés vers 
// l'architecture centralisée dans apiService.ts
