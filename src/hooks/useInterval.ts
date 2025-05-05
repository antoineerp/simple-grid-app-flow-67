
import { useEffect, useRef } from 'react';

/**
 * Hook qui exécute un callback à intervalles réguliers,
 * similaire à setInterval mais adapté aux composants React.
 * 
 * @param callback La fonction à exécuter
 * @param delay Le délai en ms entre chaque exécution, null pour ne pas exécuter
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();
  
  // Se souvenir du dernier callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Configurer l'intervalle
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
