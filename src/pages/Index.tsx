
import React from 'react';
import Logo from '@/components/auth/Logo';
import LoginForm from '@/components/auth/LoginForm';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 mb-6">
        <Logo />
        <LoginForm />
      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Version: 1.0.1 - {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default Index;
