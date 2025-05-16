
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getIsLoggedIn } from '@/services/auth/authService';
import Layout from '@/components/layout/Layout';

const ProtectedLayout: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = getIsLoggedIn();
      
      if (!isLoggedIn) {
        console.log('User not authenticated, redirecting to login page');
        navigate('/', { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate]);

  // The Layout component already contains an Outlet component based on its implementation
  // So we should use it directly without passing children
  return <Layout />;
};

export default ProtectedLayout;
