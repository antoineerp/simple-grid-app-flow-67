
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

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedLayout;
