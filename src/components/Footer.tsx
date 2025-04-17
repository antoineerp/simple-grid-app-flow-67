
import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t bg-white py-4 px-4 text-center text-sm text-gray-600">
      Qualite.cloud - Système de Management de la Qualité © 
      <a 
        href="https://www.formacert.ch" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="ml-1 text-app-blue hover:underline"
      >
        FormaCert.ch
      </a>
    </footer>
  );
};

export default Footer;
