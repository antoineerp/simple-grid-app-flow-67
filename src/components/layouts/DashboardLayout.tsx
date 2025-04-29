
import React from 'react';
import { Outlet } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
