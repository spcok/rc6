import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Navigate } from '@tanstack/react-router';

interface Props {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<Props> = ({ children }) => {
  const { currentUser } = useAuthStore();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
