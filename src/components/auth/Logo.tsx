
import React, { useState } from 'react';

const Logo = () => {
  const [imageError, setImageError] = useState(false);
  const logoPath = "/public/lovable-uploads/formacert-logo.png";
  const fallbackText = "FormaCert";

  return (
    <div className="flex flex-col items-center justify-center mb-8">
      {!imageError ? (
        <img 
          src={logoPath}
          alt="Formacert Logo" 
          className="h-24 mb-4"
          onError={() => {
            console.log("Logo image failed to load, showing text instead");
            setImageError(true);
          }}
        />
      ) : (
        <div className="h-24 mb-4 flex items-center justify-center">
          <span className="text-3xl font-bold text-app-blue">{fallbackText}</span>
        </div>
      )}
      <h2 className="text-2xl font-semibold text-gray-800">Qualite.cloud</h2>
      <p className="text-gray-600 mt-1">Plateforme de Gestion de Certification</p>
    </div>
  );
};

export default Logo;
