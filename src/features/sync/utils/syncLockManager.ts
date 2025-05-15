
/**
 * Gestionnaire de verrous pour éviter les synchronisations simultanées
 */

const locks = new Map<string, { acquiredAt: number, timeout: number }>();

export const acquireLock = (resourceId: string, timeoutMs = 30000): boolean => {
  // Vérifier si un verrou existe déjà
  if (locks.has(resourceId)) {
    const lock = locks.get(resourceId)!;
    const now = Date.now();
    
    // Si le verrou est expiré, on le libère
    if (now - lock.acquiredAt > lock.timeout) {
      releaseLock(resourceId);
    } else {
      // Verrou actif, impossible d'acquérir
      return false;
    }
  }
  
  // Acquérir le verrou
  locks.set(resourceId, {
    acquiredAt: Date.now(),
    timeout: timeoutMs
  });
  
  return true;
};

export const releaseLock = (resourceId: string): void => {
  locks.delete(resourceId);
};

export const isLocked = (resourceId: string): boolean => {
  if (!locks.has(resourceId)) return false;
  
  const lock = locks.get(resourceId)!;
  const now = Date.now();
  
  // Vérifier si le verrou est expiré
  if (now - lock.acquiredAt > lock.timeout) {
    releaseLock(resourceId);
    return false;
  }
  
  return true;
};
