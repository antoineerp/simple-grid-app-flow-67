
import { useEffect, useRef } from 'react';

/**
 * Hook qui exécute une fonction à intervalles réguliers
 * @param callback La fonction à exécuter
 * @param delay Délai en ms (null pour arrêter l'intervalle)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(callback);

  // Se souvenir de la dernière fonction de callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurer l'intervalle
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    
    return undefined;
  }, [delay]);
}
