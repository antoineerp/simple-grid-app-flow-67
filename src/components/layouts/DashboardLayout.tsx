
import React from 'react';
import Layout from '@/components/layout/Layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </Layout>
  );
};

export default DashboardLayout;
