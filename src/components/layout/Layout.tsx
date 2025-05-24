
// Layout principal simplifié
import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
