
import React from 'react';
import LogoSelector from '../LogoSelector';

export const Header: React.FC = () => {
  const [logo, setLogo] = React.useState("/lovable-uploads/4c7adb52-3da0-4757-acbf-50a1eb1d4bf5.png");

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex justify-between items-center py-2">
        <div className="flex items-center space-x-4">
          <LogoSelector currentLogo={logo} onLogoChange={handleLogoChange} />
          <h1 className="text-xl font-bold">Qualité.flow - Système de Management de la Qualité</h1>
        </div>
      </div>
    </header>
  );
};
