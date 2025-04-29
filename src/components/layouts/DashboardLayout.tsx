
import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-6">
      {children}
    </div>
  );
};

export default DashboardLayout;
