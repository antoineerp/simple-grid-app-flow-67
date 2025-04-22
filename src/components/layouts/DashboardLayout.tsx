
import React, { ReactNode } from 'react';
import Layout from '@/components/Layout';

interface DashboardLayoutProps {
  children: ReactNode;
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
