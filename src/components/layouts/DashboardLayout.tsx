
import React, { ReactNode } from 'react';
import Layout from '@/components/Layout';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </Layout>
  );
};

export default DashboardLayout;
