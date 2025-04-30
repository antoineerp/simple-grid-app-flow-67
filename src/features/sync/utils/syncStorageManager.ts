
/**
 * Utility for managing data storage during synchronization
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Generate a unique storage key for a table
export const getStorageKey = (tableName: string, syncKey?: string): string => {
  const userId = getCurrentUser() || 'default';
  return syncKey ? 
    `${tableName}_${syncKey}_${userId}` : 
    `${tableName}_${userId}`;
};

// Save data to local storage
export const saveLocalData = <T>(tableName: string, data: T[], syncKey?: string): void => {
  try {
    const storageKey = getStorageKey(tableName, syncKey);
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`SyncStorageManager: Data saved locally for ${tableName}`);
  } catch (error) {
    console.error(`SyncStorageManager: Error saving data for ${tableName}:`, error);
  }
};

// Load data from local storage
export const loadLocalData = <T>(tableName: string, syncKey?: string): T[] => {
  try {
    const storageKey = getStorageKey(tableName, syncKey);
    const localData = localStorage.getItem(storageKey);
    
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (error) {
    console.error(`SyncStorageManager: Error loading data for ${tableName}:`, error);
  }
  return [];
};

// Mark a table as having pending changes
export const markPendingSync = (tableName: string): void => {
  try {
    localStorage.setItem(`pending_sync_${tableName}`, Date.now().toString());
  } catch (error) {
    console.error(`SyncStorageManager: Error marking pending sync for ${tableName}:`, error);
  }
};

// Remove pending sync marker
export const clearPendingSync = (tableName: string): void => {
  try {
    localStorage.removeItem(`pending_sync_${tableName}`);
  } catch (error) {
    console.error(`SyncStorageManager: Error clearing pending sync for ${tableName}:`, error);
  }
};

// Check if a table has pending changes
export const hasPendingSync = (tableName: string): boolean => {
  return localStorage.getItem(`pending_sync_${tableName}`) !== null;
};
