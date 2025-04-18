
import { useState, useEffect } from 'react';

export const useLogoLoader = () => {
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png");

  useEffect(() => {
    const img = new Image();
    img.src = "/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png";
    img.onload = () => {
      console.log("Logo FormaCert chargé avec succès");
      setLogoSrc("/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png");
    };
    img.onerror = () => {
      console.log("Échec du chargement du logo FormaCert, utilisation du logo de secours");
      setLogoSrc("/logo-swiss.svg");
    };
  }, []);

  return logoSrc;
};
