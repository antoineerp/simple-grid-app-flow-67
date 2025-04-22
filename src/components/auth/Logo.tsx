
import React, { useState } from 'react';

const Logo = () => {
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png");

  return (
    <div className="flex flex-col items-center mb-8">
      <img 
        src={logoSrc}
        alt="FormaCert Logo" 
        className="w-48 mb-4"
        onError={() => setLogoSrc("/lovable-uploads/formacert-logo.png")}
      />
      <h1 className="text-2xl font-bold text-gray-800">Bienvenue sur FormaCert</h1>
    </div>
  );
};

export default Logo;
