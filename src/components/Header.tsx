
import React from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('currentUser') || 'Utilisateur';
  const role = localStorage.getItem('userRole') || 'utilisateur';
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/');
  };
  
  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="font-semibold text-lg text-gray-800">
        FormaCert™ <span className="text-xs text-gray-500">v1.0.7</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className="bg-gray-100 rounded-full p-2">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Se déconnecter
        </button>
      </div>
    </header>
  );
};

export default Header;
