
import { useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour exécuter une fonction à intervalle régulier
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();
  
  // Se souvenir du callback le plus récent
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Mettre en place l'intervalle
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    
    return undefined;
  }, [delay]);
}
