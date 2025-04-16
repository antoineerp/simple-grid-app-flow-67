
import React from 'react';
import { ChevronDown, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          <Upload className="w-5 h-5 text-gray-500 mr-4" />
          <Link to="/" className="text-app-blue text-xl font-semibold">
            Qualité.Cloud
          </Link>
        </div>
        <div className="flex items-center">
          <div className="flex items-center space-x-1 cursor-pointer">
            <span className="text-sm font-medium">p71x6d_system</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
