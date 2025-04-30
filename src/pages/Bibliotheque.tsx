
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// Ce composant est maintenant juste une redirection vers la page Collaboration
const Bibliotheque: React.FC = () => {
  useEffect(() => {
    console.log('Redirection depuis l\'ancienne page Bibliotheque vers Collaboration');
  }, []);

  return <Navigate to="/collaboration" replace />;
};

export default Bibliotheque;
